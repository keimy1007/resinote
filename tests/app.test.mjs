import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { loadQuestions } from '../scripts/content.mjs';
import { SUBJECTS } from '../src/catalog.js';
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
    assert.ok(['past','original'].includes(q.kind));
    if(q.kind==='past')assert.ok(q.image||q.format==='reproduced');
    if(q.image)assert.ok(existsSync(new URL(`../public/${q.image}`,import.meta.url)),q.image);
  }
});

test('combined subject/source/image filters do not leak other subjects',()=>{
  const qs=selectQuestions(bank,{subject:'uveitis',kind:'past',images:true},emptyState());
  assert.ok(qs.length>10);
  assert.ok(qs.every(q=>q.subject==='uveitis'&&q.kind==='past'&&q.image));
  assert.equal(selectQuestions(bank,{subject:'neuro',images:true},emptyState()).length,0);
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

test('self-grading updates weak review, and regrading does not inflate attempts',()=>{
  const state=emptyState();const q=bank[0];const s=makeSession([q]);
  gradeQuestion(state,s,q.id,'wrong');
  assert.equal(selectQuestions(bank,{review:'weak'},state).length,1);
  gradeQuestion(state,s,q.id,'correct');
  assert.equal(state.records[q.id].attempts,1);
  assert.equal(selectQuestions(bank,{review:'weak'},state).length,0);
  const next=makeSession([q]);gradeQuestion(state,next,q.id,'unsure');
  assert.equal(state.records[q.id].attempts,2);
  assert.equal(selectQuestions(bank,{review:'weak'},state).length,1);
  assert.equal(selectQuestions(bank,{review:'new'},state).length,bank.length-1);
});

test('bookmark and unanswered filters handle empty results without creating sessions',()=>{
  const state=emptyState();assert.equal(selectQuestions(bank,{review:'bookmarks'},state).length,0);
  state.bookmarks.push(bank[0].id);
  assert.deepEqual(selectQuestions(bank,{review:'bookmarks'},state).map(q=>q.id),[bank[0].id]);
  assert.equal(selectQuestions(bank,{review:'bookmarks',subject:'neuro'},state).length,0);
});

test('saved test answers, resume index and grades survive round trip',()=>{
  const state=emptyState();state.active=makeSession(bank.slice(0,3),{mode:'test',random:false});
  state.active.index=1;state.active.answers[bank[0].id]='RPEと内境界膜を区別する。';
  gradeQuestion(state,state.active,bank[0].id,'correct');
  const storage={getItem(key){assert.equal(key,STORAGE_KEY);return JSON.stringify(state);}};
  const loaded=readState(storage);assert.deepEqual(loaded,state);
  assert.equal(loaded.active.index,1);assert.equal(loaded.active.mode,'test');
  assert.equal(loaded.active.revealed,false);
});

test('corrupt or unavailable browser storage starts safely',()=>{
  assert.deepEqual(readState({getItem(){return '{bad';}}),emptyState());
  assert.deepEqual(readState({getItem(){throw new Error('blocked');}}),emptyState());
  assert.deepEqual(readState({getItem(){return '{"version":99}';}}),emptyState());
});

test('progress counts distinct questions, not answer attempts',()=>{
  const state=emptyState();const s=makeSession(bank.slice(0,3));
  gradeQuestion(state,s,bank[0].id,'wrong');gradeQuestion(state,s,bank[0].id,'correct');gradeQuestion(state,s,bank[1].id,'unsure');
  assert.deepEqual(summarize(bank.slice(0,3).map(q=>q.id),state),{total:3,seen:2,correct:1,weak:1,percent:67});
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
