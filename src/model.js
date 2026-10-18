export const STORAGE_KEY='resinote-v1';
export const emptyState=()=>({version:1, records:{}, bookmarks:[], sessions:[], active:null});

export function readState(storage) {
  try {
    const raw=JSON.parse(storage.getItem(STORAGE_KEY));
    if(raw?.version!==1 || !raw.records || !Array.isArray(raw.bookmarks) || !Array.isArray(raw.sessions)) return emptyState();
    for(const record of Object.values(raw.records))if(record.grade==='unsure')record.grade='wrong';
    if(raw.active?.grades)for(const id of Object.keys(raw.active.grades))if(raw.active.grades[id]==='unsure')raw.active.grades[id]='wrong';
    if(raw.active?.mode==='test')raw.active.mode='study';
    return raw;
  } catch { return emptyState(); }
}

export function selectQuestions(bank, options, state) {
  const search=(options.search||'').normalize('NFKC').toLowerCase().trim();
  return bank.filter(q=>
    (!options.subject||options.subject==='all'||q.subject===options.subject)&&
    (!options.kind||options.kind==='all'||q.kind===options.kind)&&
    (!options.images||!!q.image)&&
    (!options.topic||q.topic===options.topic)&&
    (options.review!=='wrong'||state.records[q.id]?.grade!=='correct')&&
    (options.review!=='correct'||state.records[q.id]?.grade==='correct')&&
    (!options.bookmarks||state.bookmarks.includes(q.id))&&
    (!search||`${q.prompt} ${q.answer} ${q.topic} ${q.explanation}`.normalize('NFKC').toLowerCase().includes(search))
  );
}

export function makeSession(questions, {count=10,random=true,subject='all'}={}, rng=Math.random) {
  const list=[...questions];
  if(random) for(let i=list.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  const ids=list.slice(0,count==='all'?list.length:Number(count)).map(q=>q.id);
  if(!ids.length)return null;
  return {id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,mode:'study',subject,ids,index:0,grades:{},revealed:false,finished:false,startedAt:new Date().toISOString()};
}

export function gradeQuestion(state,session,id,grade,now=new Date().toISOString()) {
  if(!session.ids.includes(id)||!['correct','wrong'].includes(grade))return state;
  const old=state.records[id];
  const already=Object.hasOwn(session.grades,id);
  session.grades[id]=grade;
  state.records[id]={grade,attempts:(old?.attempts||0)+(already?0:1),lastAt:now};
  return state;
}

export function summarize(ids,state) {
  const correct=ids.filter(id=>state.records[id]?.grade==='correct').length;
  return {total:ids.length,correct,wrong:ids.length-correct,percent:ids.length?Math.round(correct/ids.length*100):0};
}
