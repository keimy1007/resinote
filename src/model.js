export const STORAGE_KEY='resinote-v1';
export const emptyState=()=>({version:1, records:{}, bookmarks:[], sessions:[], active:null});

export function readState(storage) {
  try {
    const raw=JSON.parse(storage.getItem(STORAGE_KEY));
    if(raw?.version!==1 || !raw.records || !Array.isArray(raw.bookmarks) || !Array.isArray(raw.sessions)) return emptyState();
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
    (options.review!=='weak'||['wrong','unsure'].includes(state.records[q.id]?.grade))&&
    (options.review!=='new'||!state.records[q.id])&&
    (options.review!=='bookmarks'||state.bookmarks.includes(q.id))&&
    (!search||`${q.prompt} ${q.answer} ${q.topic} ${q.explanation}`.normalize('NFKC').toLowerCase().includes(search))
  );
}

export function makeSession(questions, {mode='study',count=10,random=true,subject='all'}={}, rng=Math.random) {
  const list=[...questions];
  if(random) for(let i=list.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  const ids=list.slice(0,count==='all'?list.length:Number(count)).map(q=>q.id);
  if(!ids.length)return null;
  return {id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,mode,subject,ids,index:0,answers:{},grades:{},revealed:false,finished:false,startedAt:new Date().toISOString()};
}

export function gradeQuestion(state,session,id,grade,now=new Date().toISOString()) {
  if(!session.ids.includes(id)||!['correct','unsure','wrong'].includes(grade))return state;
  const old=state.records[id];
  const already=Object.hasOwn(session.grades,id);
  session.grades[id]=grade;
  state.records[id]={grade,attempts:(old?.attempts||0)+(already?0:1),lastAt:now};
  return state;
}

export function summarize(ids,state) {
  const records=ids.map(id=>state.records[id]).filter(Boolean);
  const correct=records.filter(r=>r.grade==='correct').length;
  return {total:ids.length,seen:records.length,correct,weak:records.filter(r=>r.grade!=='correct').length,percent:ids.length?Math.round(records.length/ids.length*100):0};
}
