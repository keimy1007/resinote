import { QUESTIONS } from './questions.js';
import { SUBJECTS, REFERENCES, EDITORIAL_NOTES } from './catalog.js';
import { readState, selectQuestions, makeSession, gradeQuestion, summarize, STORAGE_KEY } from './model.js';

const app=document.querySelector('#app');
const setupDialog=document.querySelector('#setup-dialog');
const imageDialog=document.querySelector('#image-dialog');
const byId=new Map(QUESTIONS.map(q=>[q.id,q]));
let state=readState(localStorage);
state.bookmarks=state.bookmarks.filter(id=>byId.has(id));
let view='home';
let filters={subject:'all',kind:'past',year:'all',review:'wrong',search:'',images:false,bookmarks:false};
let setup={subject:'all',count:'10',kind:'past',year:'all',review:'wrong',images:false,random:true,bookmarks:false};
let toastTimer;
let storageFailed=false;
if(state.active&&(!Array.isArray(state.active.ids)||state.active.ids.some(id=>!byId.has(id))))state.active=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const subjectOf=id=>SUBJECTS.find(s=>s.id===id);
const dateLabel=date=>new Intl.DateTimeFormat('ja-JP',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(date));
const paths={
 eye:'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 home:'m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
 book:'M12 5v16M12 5C8 2 3 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-2-10 1Z',
 chart:'M4 20V10m8 10V4m8 16v-7', bookmark:'M6 3h12v18l-6-4-6 4Z',
 arrow:'M5 12h14m-6-6 6 6-6 6', chevron:'m9 5 7 7-7 7', check:'m5 12 4 4L19 6',
 close:'m6 6 12 12M6 18 18 6', repeat:'M3 10a9 9 0 0 1 15-5l3 3M21 3v5h-5M21 14A9 9 0 0 1 6 19l-3-3M3 21v-5h5',
 search:'M20 20l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
 sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
 layers:'m12 3 10 6-10 6L2 9Zm-9 10 9 5 9-5M3 17l9 5 9-5',
 focus:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 scissors:'m8 8 12 12M8 16 20 4M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 waves:'M2 6c5-5 5 5 10 0s5 5 10 0M2 12c5-5 5 5 10 0s5 5 10 0M2 18c5-5 5 5 10 0s5 5 10 0',
 spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z',
 smile:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M8 14c2 3 6 3 8 0M8 9h.01M16 9h.01',
 network:'M9 6H5v12h4M15 6h4v12h-4M9 12h6M9 3v6h6V3ZM9 15v6h6v-6Z',
 image:'M3 3h18v18H3Zm0 13 6-6 5 5 3-3 4 4M16 7h.01',
 info:'M12 10v7m0-10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
 clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
 play:'m8 4 12 8-12 8Z', expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'
};
const icon=(name,extra='')=>`<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.eye}"/></svg>`;
const btn=(label,action,classes='secondary',attrs='')=>`<button class="button ${classes}" data-action="${action}" ${attrs}>${label}</button>`;
const tags=q=>`<span class="tag tag-${q.kind}">${{past:'過去問',original:'オリジナル',specialist:'専門医試験'}[q.kind]}</span>${q.kind==='specialist'?`<span class="tag">${q.year}年 · ${q.paper==='ippan'?'一般':'臨床'}${q.number}</span>`:''}${q.image?`<span class="tag tag-image">${icon('image')}画像あり</span>`:''}${q.format==='reproduced'?'<span class="tag">再現記録・元画像なし</span>':''}`;

const copyButton=id=>btn('コピー','copy-question','text-button copy-question',`data-id="${id}" aria-label="問題文をコピー"`);

function toast(message){clearTimeout(toastTimer);const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageFailed=true;toast('保存できませんでした。ブラウザの保存容量・設定を確認してください。');}}
function navigate(next){view=next;render();window.scrollTo({top:0});document.querySelector('#main')?.focus({preventScroll:true});}
function progressBar(percent,label='覚えた問題の割合'){return `<div class="progress-track" role="progressbar" aria-label="${label}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div>`;}

function render(){
  const stats=summarize(QUESTIONS.map(q=>q.id),state);
  app.innerHTML=`<aside class="sidebar">
    <button class="brand" data-action="nav" data-view="home" aria-label="ResiNote ホーム"><span class="brand-icon">${icon('eye')}</span><span>ResiNote<small>OPHTHALMOLOGY</small></span></button>
    <div class="edition">レジデント試験 <strong>2026</strong></div>
    <nav class="navigation" aria-label="メインメニュー">
      ${[['home','home','学習ホーム'],['library','book','問題一覧'],['progress','chart','学習記録']].map(([key,ic,label])=>`<button class="nav-item ${view===key?'active':''}" data-action="nav" data-view="${key}" aria-label="${label}" ${view===key?'aria-current="page"':''}>${icon(ic)}<span>${label}</span>${key==='library'?`<small>${QUESTIONS.length}</small>`:''}</button>`).join('')}
      <button class="nav-item ${view==='library'&&filters.bookmarks?'active':''}" data-action="bookmarks" aria-label="ブックマーク">${icon('bookmark')}<span>ブックマーク</span><small>${state.bookmarks.length}</small></button>
    </nav>
    <div class="sidebar-bottom"><div class="sidebar-progress"><span>覚えた</span><strong>${stats.correct}<small> / ${stats.total}問</small></strong>${progressBar(stats.percent)}<p>${stats.percent}% を覚えた</p></div>
    <button class="nav-item" data-action="nav" data-view="about" aria-label="資料と出題方針">${icon('info')}<span>資料と出題方針</span></button><p class="local-note">${icon('check')}学習記録はこのブラウザに保存</p></div>
  </aside><div class="workspace"><header class="topbar"><span>眼科レジデント試験対策</span><div><span class="status-dot"></span>全8科目<span class="year-pill">2026</span></div></header>
  <main id="main" tabindex="-1">${view==='home'?home(stats):view==='library'?library():view==='progress'?progress():view==='about'?about():sessionView()}</main>
  <footer>ResiNote<button data-action="nav" data-view="about">資料・参考解答について</button></footer></div>`;
  if(storageFailed)toast('学習記録を保存できていません。ブラウザの設定を確認してください。');
}

function home(stats){
  const past=QUESTIONS.filter(q=>q.kind==='past').length;
  const images=QUESTIONS.filter(q=>q.kind==='past'&&q.image).length;
  const originals=QUESTIONS.filter(q=>q.kind==='original').length;
  const specialists=QUESTIONS.filter(q=>q.kind==='specialist').length;
  return `<section class="welcome"><h1>学習ホーム</h1><div class="home-actions">${btn(`一問一答 ${icon('arrow')}`,'setup','primary')}${btn('専門医試験','setup','secondary','data-kind="specialist"')}</div></section>
  ${state.active?`<div class="resume-strip">${icon('clock')}<div><strong>${state.active.finished?'チェック・結果の続きへ':'前回の続きから'}</strong><span>${state.active.kind==='specialist'?'専門医試験':'一問一答'} · ${subjectOf(state.active.subject)?.name||'全科目'} · ${state.active.index+1} / ${state.active.ids.length}問</span></div>${btn(`再開 ${icon('arrow')}`,'resume','text-button')}</div>`:''}
  <section class="stats-grid" aria-label="問題数と学習状況"><div><span>収録問題</span><strong>${QUESTIONS.length}<small>問</small></strong><p>過去問 ${past} / オリジナル ${originals}<br>専門医試験 ${specialists}</p></div><div><span>画像付き過去問</span><strong>${images}<small>問</small></strong></div><div><span>覚えた</span><strong>${stats.correct}<small>問</small></strong></div><button data-action="setup" data-review="wrong" class="weak-stat"><span>覚えてない</span><strong>${stats.wrong}<small>問</small>${icon('arrow')}</strong><p>復習する</p></button></section>
  <section class="subject-section"><div class="section-heading"><h2>科目</h2></div><div class="subject-grid">${SUBJECTS.map((s,i)=>subjectCard(s,i)).join('')}</div></section>`;
}

function subjectCard(s,i){
  const qs=QUESTIONS.filter(q=>q.subject===s.id);const stats=summarize(qs.map(q=>q.id),state);
  return `<article class="subject-card"><div class="subject-head"><span class="subject-icon color-${i}">${icon(s.icon)}</span><span class="subject-index">${String(i+1).padStart(2,'0')}</span></div><div class="subject-title"><h3>${s.name}</h3><span>${qs.length}<small>問</small></span></div><p class="subject-description">${s.description}</p><div class="subject-progress"><span>${stats.correct}問 覚えた</span><span>${stats.percent}%</span></div>${progressBar(stats.percent)}<div class="subject-actions">${btn(`一問一答 ${icon('arrow')}`,'setup','text-button',`data-subject="${s.id}"`)}</div></article>`;
}

function filterControls(){return `<div class="filters"><label>科目<select id="filter-subject">${subjectOptions(filters.subject)}</select></label><label>出題元<select id="filter-kind">${kindOptions(filters.kind)}</select></label><label id="filter-year-label" ${filters.kind==='specialist'?'':'hidden'}>年度<select id="filter-year">${yearOptions(filters.year)}</select></label><label>学習状態<select id="filter-review">${reviewOptions(filters.review)}</select></label><label class="check-label"><input id="filter-images" type="checkbox" ${filters.images?'checked':''}>画像あり</label></div>`;}
function subjectOptions(value){return `<option value="all" ${value==='all'?'selected':''}>全8科目</option>`+SUBJECTS.map(s=>`<option value="${s.id}" ${value===s.id?'selected':''}>${s.name}</option>`).join('');}
function kindOptions(value){return [['all','すべて'],['past','過去問'],['original','オリジナル'],['specialist','専門医試験']].map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join('');}
function yearOptions(value){return [['all','3年分'],['2026','2026年'],['2025','2025年'],['2024','2024年']].map(([v,l])=>`<option value="${v}" ${String(value)===v?'selected':''}>${l}</option>`).join('');}
function reviewOptions(value){return [['all','すべて'],['correct','覚えた'],['wrong','覚えてない']].map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join('');}
function library(){return `<h1>${filters.bookmarks?'ブックマーク':'問題一覧'}</h1><div class="search-box">${icon('search')}<input id="search" type="search" value="${esc(filters.search)}" placeholder="疾患名・キーワードで検索" aria-label="問題を検索"></div>${filterControls()}<div id="library-results">${libraryResults()}</div>`;}
function libraryResults(){
  const qs=selectQuestions(QUESTIONS,filters,state);
  return `<div class="result-heading"><strong>${qs.length}<span>問が見つかりました</span></strong>${btn('この条件で学習','study-filter','secondary',qs.length?'':'disabled')}</div>${qs.length?`<div class="question-list">${qs.map(q=>`<article class="question-row"><button class="question-open" data-action="single" data-id="${q.id}"><div class="question-meta"><span class="subject-name">${subjectOf(q.subject).name}</span>${tags(q)}<span class="tag memory-status ${state.records[q.id]?.grade==='correct'?'correct':'wrong'}">${state.records[q.id]?.grade==='correct'?'覚えた':'覚えてない'}</span></div><h3>${esc(q.prompt)}</h3><p>${esc(q.topic)}</p></button><div class="question-actions">${copyButton(q.id)}<button class="bookmark-button ${state.bookmarks.includes(q.id)?'bookmarked':''}" data-action="bookmark" data-id="${q.id}" aria-label="${state.bookmarks.includes(q.id)?'ブックマーク解除':'ブックマークに追加'}" aria-pressed="${state.bookmarks.includes(q.id)}">${icon('bookmark')}</button></div></article>`).join('')}</div>`:empty('該当する問題がありません','科目・出題元・学習状態の条件を変えてみてください。')}`;
}
function empty(title,text){return `<div class="empty-state">${icon('book')}<h2>${title}</h2><p>${text}</p></div>`;}

function openSetup(options={}){
  setup={subject:'all',count:'10',kind:'past',year:'all',review:'wrong',images:false,random:true,bookmarks:false,...options};
  setupDialog.innerHTML=`<div class="dialog-head"><span></span><button class="icon-button" data-action="close-setup" aria-label="閉じる">${icon('close')}</button></div><h2 id="setup-title">${setup.bookmarks?'ブックマークから学習':'学習設定'}</h2><form id="setup-form"><div class="setup-grid"><label>科目<select name="subject">${subjectOptions(setup.subject)}</select></label><label>問題数<select name="count">${[['10','10問'],['20','20問'],['50','50問'],['all','すべて']].map(([v,l])=>`<option value="${v}" ${String(setup.count)===v?'selected':''}>${l}</option>`).join('')}</select></label><label>出題元<select name="kind">${kindOptions(setup.kind)}</select></label><label id="setup-year-label" ${setup.kind==='specialist'?'':'hidden'}>年度<select name="year">${yearOptions(setup.year)}</select></label><label>学習状態<select name="review">${reviewOptions(setup.review)}</select></label></div><div class="setup-checks"><label><input name="images" type="checkbox" ${setup.images?'checked':''}>画像付きのみ</label><label><input name="random" type="checkbox" ${setup.random?'checked':''}>ランダムに出題</label></div><div id="setup-preview"></div>${state.active?'<p class="small muted">新しく始めると途中のセッションは置き換わります。チェック済みの学習記録は残ります。</p>':''}<button type="submit" class="button primary full-width" id="start-button">学習をスタート ${icon('arrow')}</button></form>`;
  updateSetupPreview();setupDialog.showModal();
}
function readSetup(){const form=new FormData(document.querySelector('#setup-form'));setup={...setup,subject:form.get('subject'),count:form.get('count'),kind:form.get('kind'),year:form.get('year'),review:form.get('review'),images:form.has('images'),random:form.has('random')};}
function updateSetupPreview(){
  document.querySelector('#setup-year-label').hidden=setup.kind!=='specialist';
  const matching=selectQuestions(QUESTIONS,setup,state).length;
  const count=setup.count==='all'?matching:Math.min(Number(setup.count),matching);
  document.querySelector('#setup-preview').innerHTML=`<strong>${count}問</strong><span>${matching}問の候補から出題</span>${!matching?'<p>この条件の問題はありません。条件を変更してください。</p>':''}`;
  document.querySelector('#start-button').disabled=!matching;
}
function startSession(qs,options){state.active=makeSession(qs,options);if(!state.active){toast('この条件の問題がありません');return;}save();navigate('session');}

function sessionView(){
  const s=state.active;if(!s)return empty('学習をはじめましょう','ホームから科目を選んでください。');
  if(s.finished)return results(s);
  const q=byId.get(s.ids[s.index]);const subject=subjectOf(q.subject);
  const marked=state.bookmarks.includes(q.id);const grade=s.grades[q.id];
  return `<div class="session-top">${btn(`${icon('home')} ホーム`,'nav','text-button','data-view="home"')}<span>${s.kind==='specialist'?'専門医試験':'一問一答'} · ${subjectOf(s.subject)?.name||'全科目'}</span><strong>${s.index+1}<small> / ${s.ids.length}</small></strong></div>${progressBar(Math.round(s.index/s.ids.length*100),'解答の進捗')}
  <section class="question-card"><div class="question-toolbar"><div class="question-meta"><span class="subject-name">${subject.name}</span>${tags(q)}</div><div class="question-actions">${copyButton(q.id)}<button class="bookmark-button ${marked?'bookmarked':''}" data-action="bookmark" data-id="${q.id}" aria-label="${marked?'ブックマーク解除':'ブックマークに追加'}" aria-pressed="${marked}">${icon('bookmark')}</button></div></div><div class="question-number">QUESTION ${String(s.index+1).padStart(2,'0')}</div><h1 class="question-prompt">${esc(q.prompt)}</h1>${q.kind==='specialist'?'<p class="small muted">出題論点を一問一答に再構成</p>':''}
  ${q.image?`<figure class="question-figure"><button data-action="zoom" data-id="${q.id}" aria-label="問題画像を拡大"><img src="./${q.image}" alt="${subject.name}の提示画像" decoding="async"><span>${icon('expand')}拡大して見る</span></button><figcaption>元資料の画像</figcaption></figure>`:q.format==='reproduced'?'<div class="image-unavailable">この設問の元画像は提供資料にないため、再現記録から文章で出題しています。</div>':''}
  ${s.revealed?solution(q)+`<div class="rating-panel">${ratingButtons(q.id,grade)}<div class="next-row">${btn(s.index===s.ids.length-1?`結果を見る ${icon('arrow')}`:`次の問題 ${icon('arrow')}`,'next','primary')}</div></div>`:`<div class="reveal-row">${btn(`${icon('eye')} 答えと解説を見る`,'reveal','primary')}<span>Spaceで表示</span></div>`}</section><p class="session-help">${icon('check')}途中でも保存されます。ホームの「再開」から続きを学習できます。</p>`;
}
function solution(q){
  const subject=subjectOf(q.subject);
  let refs=q.refs||subject.refs;
  if(!q.refs&&q.subject==='retina-medical')refs=q.topic==='AMD'?['amd']:q.topic==='ERG'?['erg']:q.topic==='RP'?['rp']:q.topic==='遺伝性網膜疾患'?['stargardt','rp']:['rp'];
  return `<div class="solution"><div class="answer-toolbar"><span class="answer-eyebrow">${q.answerStatus.startsWith('参考解答')?'参考解答':'解答'}</span>${btn('解答をコピー','copy-answer','text-button',`data-id="${q.id}" aria-label="解答をコピー"`)}</div><h2>${esc(q.answer)}</h2><div class="knowledge"><h3>${icon('spark')}解説・周辺知識</h3><p>${esc(q.explanation)}</p></div><details class="source-details"><summary>出題の根拠・参考資料</summary><p><strong>${q.kind==='past'?'元資料':'出題範囲の根拠'}</strong><br>${esc(q.source)}</p>${q.sourceUrl?`<p><a href="${esc(q.sourceUrl)}" target="_blank" rel="noopener noreferrer">元の解説ページ（該当問題） ↗</a></p><p><a href="${esc(q.originalUrl)}" target="_blank" rel="noopener noreferrer">学会の過去問題公開ページ ↗</a></p>`:''}<p class="source-status">${esc(q.answerStatus)}</p>${refs.length?`<p class="small">関連事項の確認に使う資料</p><ul>${refs.map(id=>`<li><a href="${REFERENCES[id].url}" target="_blank" rel="noopener noreferrer">${esc(REFERENCES[id].title)} ↗</a>${REFERENCES[id].note?`<p class="small">${esc(REFERENCES[id].note)}</p>`:''}</li>`).join('')}</ul>`:''}</details></div>`;
}
function ratingButtons(id,grade){return `<div class="rating-buttons" role="group" aria-label="記憶のチェック">${[['correct','覚えた','1'],['wrong','覚えてない','2']].map(([value,label,key])=>`<button data-action="grade" data-id="${id}" data-grade="${value}" class="rating ${value} ${grade===value?'selected':''}" aria-pressed="${grade===value}"><kbd>${key}</kbd>${label}${grade===value?icon('check'):''}</button>`).join('')}</div>`;}

function results(s){
  const values=Object.values(s.grades);const graded=values.length;const correct=values.filter(g=>g==='correct').length;
  const weak=s.ids.filter(id=>s.grades[id]&&s.grades[id]!=='correct');
  return `<h1>学習結果</h1><section class="result-summary"><div class="result-score"><strong>${correct}<span> / ${s.ids.length}</span></strong><p>覚えた問題 · チェック</p></div><div class="result-numbers"><span>覚えた <b>${correct}</b></span><span>覚えてない <b>${values.filter(g=>g==='wrong').length}</b></span></div></section><div class="review-actions">${btn('記録して終了','complete','primary')}${btn(`覚えてない問題をもう一度 (${weak.length}問)`,'retry','secondary',weak.length?'':'disabled')}<span>${graded} / ${s.ids.length}問 チェック済み</span></div>
  <div class="review-list">${s.ids.map((id,i)=>{const q=byId.get(id);return `<article class="review-card" id="review-${i}"><div class="question-meta"><span class="question-number">Q${i+1}</span><span class="subject-name">${subjectOf(q.subject).name}</span>${tags(q)}${copyButton(q.id)}</div><h2>${esc(q.prompt)}</h2>${q.image?`<button class="review-image" data-action="zoom" data-id="${id}"><img src="./${q.image}" alt="提示画像" loading="lazy">${icon('expand')}</button>`:''}${solution(q)}${ratingButtons(id,s.grades[id])}</article>`;}).join('')}</div><div class="review-actions">${btn('記録して終了','complete','primary')}</div>`;
}
function archiveSession(){
  const s=state.active;if(!s)return;
  const entry={id:s.id,mode:s.mode,subject:s.subject,kind:s.kind,year:s.year,total:s.ids.length,correct:Object.values(s.grades).filter(g=>g==='correct').length,graded:Object.keys(s.grades).length,date:new Date().toISOString()};
  state.sessions=[entry,...state.sessions.filter(x=>x.id!==s.id)].slice(0,100);
}

function progress(){
  const stats=summarize(QUESTIONS.map(q=>q.id),state);
  return `<h1>学習記録</h1><section class="stats-grid two"><div><span>覚えた</span><strong>${stats.correct}<small>問</small></strong></div><div><span>覚えてない</span><strong>${stats.wrong}<small>問</small></strong></div></section><section class="panel"><div class="section-heading"><h2>科目ごとの学習</h2>${btn('覚えてない問題を学習','setup','secondary','data-review="wrong"')}</div><div class="subject-records">${SUBJECTS.map(s=>{const st=summarize(QUESTIONS.filter(q=>q.subject===s.id).map(q=>q.id),state);return `<div><span class="subject-icon">${icon(s.icon)}</span><strong>${s.name}</strong><div>${progressBar(st.percent)}<p>覚えた ${st.correct} · 覚えてない ${st.wrong}</p></div><span>${st.correct} / ${st.total}</span>${btn(icon('arrow'),'setup','icon-button',`data-subject="${s.id}" aria-label="${s.name}を学習"`)}</div>`;}).join('')}</div></section><section class="panel"><div class="section-heading"><h2>最近のセッション</h2><span class="muted small">最新100件まで保存</span></div>${state.sessions.length?`<div class="history-list">${state.sessions.map(s=>`<div>${icon('book')}<div><strong>${subjectOf(s.subject)?.name||'全科目'} · ${s.kind==='specialist'?'専門医試験':'一問一答'}</strong><span>${dateLabel(s.date)}</span></div><p><strong>${s.correct}</strong> / ${s.total}問<span>覚えた · チェック${s.graded<s.total?'（一部チェック）':''}</span></p></div>`).join('')}</div>`:empty('まだ記録はありません','学習を終えると、ここに記録が残ります。')}</section><p class="small muted">この端末・ブラウザの保存領域を使います。別の端末との同期はありません。ブラウザのデータを削除すると学習記録も消えます。</p>`;
}
function about(){return `<h1>資料と出題方針</h1><section class="panel editorial"><h2>この問題集について</h2>${EDITORIAL_NOTES.map(n=>`<p>${esc(n)}</p>`).join('')}<p>臨床の判断・投薬は、最新の添付文書とガイドライン、個別の診療状況に基づいて確認してください。</p></section><section class="panel"><h2>8科目の資料対応</h2><div class="evidence-list">${SUBJECTS.map(s=>`<div><strong>${s.name}</strong><p>${s.evidence}</p></div>`).join('')}</div></section><section class="panel"><h2>参考リンク</h2><p class="muted small">確認日：2026年10月18日。版・更新時期は各リンク先を確認してください。</p><ul class="reference-list">${Object.values(REFERENCES).map(r=>`<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.title)} ↗</a>${r.note?`<p>${esc(r.note)}</p>`:''}</li>`).join('')}</ul></section>`;}

document.addEventListener('click',async event=>{
  const b=event.target.closest('[data-action]');if(!b||b.disabled)return;
  const action=b.dataset.action;const s=state.active;
  if(action==='nav'){if(b.dataset.view==='library')filters.bookmarks=false;navigate(b.dataset.view);}
  if(action==='setup')openSetup({subject:b.dataset.subject||'all',review:b.dataset.review||'wrong',kind:b.dataset.kind||'past'});
  if(action==='close-setup')setupDialog.close();
  if(action==='resume')navigate('session');
  if(action==='bookmarks'){filters={subject:'all',kind:'all',year:'all',review:'all',search:'',images:false,bookmarks:true};navigate('library');}
  if(action==='study-filter')openSetup({...filters});
  if(action==='single'){
    if(s&&!window.confirm('途中の学習を終了して、この問題を開きますか？ チェック済みの記録は残ります。'))return;
    const q=byId.get(b.dataset.id);startSession([q],{count:1,subject:q.subject,kind:q.kind,year:q.year||'all',random:false});
  }
  if(action==='copy-question'||action==='copy-answer'){
    const q=byId.get(b.dataset.id);const label=action==='copy-answer'?'解答':'問題文';
    try{await navigator.clipboard.writeText(action==='copy-answer'?q.answer:q.prompt);toast(`${label}をコピーしました`);}
    catch{toast(`コピーできませんでした。${label}を選択してコピーしてください。`);}
  }
  if(action==='bookmark'){
    const id=b.dataset.id;state.bookmarks=state.bookmarks.includes(id)?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];save();
    const marked=state.bookmarks.includes(id);b.classList.toggle('bookmarked',marked);b.setAttribute('aria-pressed',String(marked));b.setAttribute('aria-label',marked?'ブックマーク解除':'ブックマークに追加');
    document.querySelector('.nav-item[data-action="bookmarks"] small').textContent=state.bookmarks.length;
    toast(marked?'ブックマークしました':'ブックマークを解除しました');
    if(view==='library'&&filters.bookmarks)document.querySelector('#library-results').innerHTML=libraryResults();
  }
  if(action==='reveal'&&s){s.revealed=true;save();render();document.querySelector('.solution')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
  if(action==='grade'&&s){
    if(!s.finished&&!s.revealed)return;
    gradeQuestion(state,s,b.dataset.id,b.dataset.grade);save();const y=window.scrollY;render();window.scrollTo({top:y});
  }
  if(action==='next'&&s){
    if(!s.revealed)return;
    if(s.index<s.ids.length-1){s.index++;s.revealed=false;}else{s.finished=true;}
    save();render();window.scrollTo({top:0});
  }
  if(action==='complete'&&s){archiveSession();state.active=null;save();navigate('progress');toast('学習記録を保存しました');}
  if(action==='retry'&&s){const weak=s.ids.filter(id=>s.grades[id]&&s.grades[id]!=='correct').map(id=>byId.get(id));archiveSession();startSession(weak,{count:'all',subject:s.subject,kind:s.kind,year:s.year});}
  if(action==='zoom'){
    const q=byId.get(b.dataset.id);imageDialog.innerHTML=`<div class="dialog-head"><span>問題画像</span><button class="icon-button" data-action="close-image" aria-label="拡大画像を閉じる">${icon('close')}</button></div><img src="./${q.image}" alt="${subjectOf(q.subject).name}の提示画像（拡大）"><p class="small muted">${esc(q.source)}</p>`;imageDialog.showModal();
  }
  if(action==='close-image')imageDialog.close();
});
document.addEventListener('submit',event=>{if(event.target.id!=='setup-form')return;event.preventDefault();readSetup();const qs=selectQuestions(QUESTIONS,setup,state);if(!qs.length)return;setupDialog.close();startSession(qs,setup);});
document.addEventListener('input',event=>{
  if(event.target.id==='search'){filters.search=event.target.value;document.querySelector('#library-results').innerHTML=libraryResults();}
});
document.addEventListener('change',event=>{
  if(event.target.closest('#setup-form')){readSetup();updateSetupPreview();}
  if(event.target.id.startsWith('filter-')){const key=event.target.id.slice(7);filters[key]=event.target.type==='checkbox'?event.target.checked:event.target.value;document.querySelector('#filter-year-label').hidden=filters.kind!=='specialist';document.querySelector('#library-results').innerHTML=libraryResults();}
});
document.addEventListener('keydown',event=>{
  if(event.target.matches('input,select,button')||setupDialog.open||imageDialog.open||view!=='session'||!state.active||state.active.finished)return;
  if(event.code==='Space'&&!state.active.revealed){event.preventDefault();document.querySelector('[data-action="reveal"]')?.click();}
  if(['1','2'].includes(event.key)&&state.active.revealed){document.querySelector(`[data-grade="${{'1':'correct','2':'wrong'}[event.key]}"]`)?.click();}
  if(event.key==='Enter')document.querySelector('[data-action="next"]')?.click();
});
render();
