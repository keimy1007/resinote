import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { loadQuestions } from '../scripts/content.mjs';
import { SUBJECTS, REFERENCES } from '../src/catalog.js';
import { emptyState, selectQuestions, makeSession, gradeQuestion, summarize, readState, STORAGE_KEY } from '../src/model.js';

const bank=loadQuestions();
test('8 subjects have distinct, traceable questions with answers and explanations',()=>{
  assert.equal(SUBJECTS.length,8);
  assert.ok(bank.length>=400);
  assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
  assert.equal(new Set(bank.map(q=>q.prompt)).size,bank.length);
  for(const subject of SUBJECTS)assert.ok(bank.filter(q=>q.subject===subject.id).length>=45);
  for(const q of bank){
    assert.ok(SUBJECTS.some(s=>s.id===q.subject));
    for(const key of ['prompt','answer','explanation','source','answerStatus','topic'])assert.ok(q[key]?.trim(),`${q.id} missing ${key}`);
    assert.ok(['past','original','specialist'].includes(q.kind));
    if(q.kind==='past')assert.ok(q.image||['text','reproduced'].includes(q.format));
    if(q.image)assert.ok(existsSync(new URL(`../public/${q.image}`,import.meta.url)),q.image);
    for(const ref of q.refs||[])assert.ok(REFERENCES[ref]?.url,`${q.id} unknown reference ${ref}`);
  }
});

test('table expansions cover all eight subjects and remain original with traceable sources',()=>{
  const added=bank.filter(q=>q.group);
  assert.equal(added.length,193);
  for(const s of SUBJECTS)assert.ok(added.filter(q=>q.subject===s.id).length>=10,s.id);
  assert.ok(added.every(q=>q.kind==='original'&&q.answerStatus.startsWith('参考解答')));
  assert.equal(bank.filter(q=>q.kind==='past').length,145);
  assert.equal(bank.filter(q=>q.kind==='past'&&q.image).length,79);
  for(let cell=1;cell<=5;cell++){
    const questions=added.filter(q=>q.group===`bleb-${cell}`);
    assert.ok(questions.length>=4,`missing coverage of table cell ${cell}`);
    assert.ok(questions.every(q=>q.image==='images/figure-025.webp'));
  }
  assert.ok(selectQuestions(bank,{kind:'original',images:true},emptyState()).length>=30);
});

test('combined subject/source/image filters do not leak other subjects',()=>{
  const qs=selectQuestions(bank,{subject:'uveitis',kind:'past',images:true},emptyState());
  assert.ok(qs.length>10);
  assert.ok(qs.every(q=>q.subject==='uveitis'&&q.kind==='past'&&q.image));
  const neuro=selectQuestions(bank,{subject:'neuro',kind:'past',images:true},emptyState());
  assert.equal(neuro.length,3);
  assert.ok(neuro.every(q=>q.subject==='neuro'&&q.kind==='past'&&q.image));
});

test('specialist coverage accounts for every source item in the three years',()=>{
  const papers=JSON.parse(readFileSync(new URL('../content/specialist-sources.json',import.meta.url),'utf8'));
  assert.equal(papers.length,6);
  const items=papers.flatMap(p=>p.items.map(i=>({...i,year:p.year,paper:p.paper})));
  assert.equal(items.length,450);
  assert.equal(new Set(items.map(i=>`${i.year}/${i.paper}/${i.number}`)).size,450);
  const specialist=bank.filter(q=>q.kind==='specialist');
  assert.equal(specialist.length,384);
  for(const p of papers){
    assert.deepEqual(p.items.map(i=>i.number),Array.from({length:p.paper==='ippan'?100:50},(_,i)=>i+1));
    for(const i of p.items){
      const q=specialist.find(q=>q.year===p.year&&q.paper===p.paper&&q.number===i.number);
      if(i.status==='included'){
        assert.equal(q?.subject,i.subject);
        assert.equal(q.sourceUrl,`${p.url}#${i.anchor}`);
        assert.match(q.answerStatus,/参考解答.*再構成.*公式解答ではありません/);
      }else{
        assert.ok(['excluded','pending'].includes(i.status));
        assert.ok(i.reason?.length>10);
        assert.equal(q,undefined);
      }
    }
  }
});

test('all three source filters combine with subjects, specialist years and saved checks',()=>{
  const state=emptyState();
  for(const subject of SUBJECTS)for(const kind of ['past','original','specialist']){
    const selected=selectQuestions(bank,{subject:subject.id,kind},state);
    assert.ok(selected.length>0,`${subject.id}/${kind}`);
    assert.ok(selected.every(q=>q.subject===subject.id&&q.kind===kind));
  }
  for(const year of [2024,2025,2026])for(const subject of SUBJECTS){
    const selected=selectQuestions(bank,{kind:'specialist',subject:subject.id,year:String(year)},state);
    assert.ok(selected.length>0,`${year}/${subject.id}`);
    assert.ok(selected.every(q=>q.year===year&&q.subject===subject.id));
    const session=makeSession(selected,{count:'all',kind:'specialist',year:String(year),subject:subject.id});
    assert.equal(session.kind,'specialist');assert.equal(session.year,String(year));
    gradeQuestion(state,session,selected[0].id,'correct');
    assert.ok(!selectQuestions(bank,{kind:'specialist',subject:subject.id,year:String(year),review:'wrong'},state).includes(selected[0]));
  }
  for(const kind of ['past','original','all'])assert.deepEqual(selectQuestions(bank,{kind,year:'2026'},state),selectQuestions(bank,{kind},state));
  assert.equal(selectQuestions(bank,{kind:'past'},state).length,145);
  assert.equal(selectQuestions(bank,{kind:'original'},state).length,328);
});


test('supplemented past questions have source locations, reference answers and relevant source filters',()=>{
  const added=JSON.parse(readFileSync(new URL('../content/past-supplement.json',import.meta.url),'utf8'));
  assert.equal(added.length,64);
  for(const subject of SUBJECTS){
    const selected=selectQuestions(bank,{subject:subject.id,kind:'past'},emptyState());
    const supplements=added.filter(q=>q.subject===subject.id);
    assert.ok(supplements.length>=6,subject.id);
    for(const q of supplements){
      const loaded=selected.find(item=>item.prompt===q.prompt);
      assert.ok(loaded,`past filter omits ${q.prompt}`);
      assert.match(q.source,/(2009|2013|2017|2018|2019|2023|2024|2025)/);
      assert.match(q.answerStatus,/^参考解答/);
      assert.ok(q.refs.length>0);
      assert.equal(Boolean(q.image),q.format==='image');
      if(q.format==='reproduced')assert.match(q.answerStatus,/元画像なし/);
    }
  }
});

test('search handles full-width Latin input and searches explanations',()=>{
  assert.deepEqual(selectQuestions(bank,{search:'ＥＲＧ'},emptyState()),selectQuestions(bank,{search:'erg'},emptyState()));
  assert.ok(selectQuestions(bank,{search:'視神経乳頭'},emptyState()).length>0);
});

test('a session caps count, never duplicates, and does not mutate source',()=>{
  const input=bank.slice(0,7);const original=[...input];
  const s=makeSession(input,{count:20},()=>0.3);
  assert.equal(s.ids.length,7);assert.equal(new Set(s.ids).size,7);assert.deepEqual(input,original);
  assert.deepEqual(makeSession(input,{count:3,random:false}).ids,input.slice(0,3).map(q=>q.id));
  assert.equal(makeSession(input,{count:'all'}).ids.length,7);
  assert.equal(makeSession([]),null);
});

test('manual checks move questions between exactly two groups without inflating attempts',()=>{
  const state=emptyState();const q=bank[0];const s=makeSession([q]);
  assert.equal(selectQuestions(bank,{review:'wrong'},state).length,bank.length);
  gradeQuestion(state,s,q.id,'wrong');
  assert.equal(selectQuestions(bank,{review:'wrong'},state).length,bank.length);
  gradeQuestion(state,s,q.id,'correct');
  assert.equal(state.records[q.id].attempts,1);
  assert.equal(selectQuestions(bank,{review:'wrong'},state).length,bank.length-1);
  assert.deepEqual(selectQuestions(bank,{review:'correct'},state).map(q=>q.id),[q.id]);
  const next=makeSession([q]);
  assert.deepEqual(next.grades,{});
  gradeQuestion(state,next,q.id,'unsure');
  assert.deepEqual(next.grades,{});
  assert.equal(state.records[q.id].grade,'correct');
  gradeQuestion(state,next,q.id,'wrong');
  assert.equal(state.records[q.id].attempts,2);
  assert.equal(selectQuestions(bank,{review:'wrong'},state).length,bank.length);
  assert.equal(selectQuestions(bank,{review:'correct'},state).length,0);
});

test('bookmarks remain independent of the two memory states',()=>{
  const state=emptyState();assert.equal(selectQuestions(bank,{bookmarks:true},state).length,0);
  state.bookmarks.push(bank[0].id);
  assert.deepEqual(selectQuestions(bank,{bookmarks:true,review:'wrong'},state).map(q=>q.id),[bank[0].id]);
  assert.equal(selectQuestions(bank,{bookmarks:true,review:'correct'},state).length,0);
  assert.equal(selectQuestions(bank,{bookmarks:true,subject:'neuro'},state).length,0);
});

test('legacy test sessions resume as immediate-answer study without losing saved records',()=>{
  const state=emptyState();state.active=makeSession(bank.slice(0,3),{mode:'test',random:false});
  state.active.mode='test';state.active.index=1;state.active.answers={[bank[0].id]:'旧版の解答メモ'};
  gradeQuestion(state,state.active,bank[0].id,'correct');
  const storage={getItem(key){assert.equal(key,STORAGE_KEY);return JSON.stringify(state);}};
  const loaded=readState(storage);assert.deepEqual(loaded,{...state,active:{...state.active,mode:'study'}});
  assert.equal(loaded.active.index,1);assert.equal(loaded.active.mode,'study');
  assert.equal(loaded.active.revealed,false);
});

test('corrupt or unavailable browser storage starts safely',()=>{
  assert.deepEqual(readState({getItem(){return '{bad';}}),emptyState());
  assert.deepEqual(readState({getItem(){throw new Error('blocked');}}),emptyState());
  assert.deepEqual(readState({getItem(){return '{"version":99}';}}),emptyState());
});

test('progress counts remembered questions and includes unchecked questions in not remembered',()=>{
  const state=emptyState();const s=makeSession(bank.slice(0,3));
  gradeQuestion(state,s,bank[0].id,'wrong');gradeQuestion(state,s,bank[0].id,'correct');gradeQuestion(state,s,bank[1].id,'wrong');
  assert.deepEqual(summarize(bank.slice(0,3).map(q=>q.id),state),{total:3,correct:1,wrong:2,percent:33});
  gradeQuestion(state,s,bank[0].id,'wrong');
  assert.deepEqual(summarize(bank.slice(0,3).map(q=>q.id),state),{total:3,correct:0,wrong:3,percent:0});
  assert.deepEqual(summarize([],state),{total:0,correct:0,wrong:0,percent:0});
});

test('old ambiguous checks migrate without losing answers, bookmarks or history',()=>{
  const state=emptyState();state.active=makeSession(bank.slice(0,3),{random:false});
  const [a,b,c]=state.active.ids;
  state.records[a]={grade:'unsure',attempts:4,lastAt:'2026-10-18T00:00:00.000Z'};
  state.records[b]={grade:'correct',attempts:2};state.records[c]={grade:'wrong',attempts:1};
  state.active.grades={[a]:'unsure',[b]:'correct'};
  state.active.answers={[a]:'保存した解答'};state.active.index=1;
  state.bookmarks=[a];state.sessions=[{id:'old',total:3,correct:1,graded:3}];
  const loaded=readState({getItem:()=>JSON.stringify(state)});
  assert.equal(loaded.records[a].grade,'wrong');
  assert.equal(loaded.records[a].attempts,4);
  assert.equal(loaded.active.grades[a],'wrong');
  assert.equal(loaded.active.grades[b],'correct');
  assert.equal(loaded.active.answers[a],'保存した解答');assert.equal(loaded.active.index,1);
  assert.deepEqual(loaded.bookmarks,state.bookmarks);assert.deepEqual(loaded.sessions,state.sessions);
  assert.deepEqual(summarize([a,b,c],loaded),{total:3,correct:1,wrong:2,percent:33});
  assert.deepEqual(readState({getItem:()=>JSON.stringify(loaded)}),loaded);
});

test('public output consists only of application files and reviewed image derivatives',()=>{
  const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(new URL(e.name+'/',p)):[e.name]);
  const files=walk(new URL('../public/',import.meta.url));
  assert.ok(files.every(f=>/\.(svg|webp)$/.test(f)));
  const content=bank.map(q=>`${q.prompt} ${q.answer} ${q.explanation}`).join('\n');
  assert.ok(!/患者ID|氏名[:：]|@gmail\.com|gho_/.test(content));
});

test('metadata and script URLs work from a GitHub Pages subdirectory',()=>{
  const html=readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
  assert.ok(!/\b(?:src|href)="\//.test(html));
  assert.match(html,/lang="ja"/);
});
