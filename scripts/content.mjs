import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SUBJECTS } from '../src/catalog.js';

function rows(file, count) {
  return readFileSync(new URL(`../content/${file}.tsv`, import.meta.url), 'utf8').split(/\r?\n/)
    .filter(line => line && !line.startsWith('#')).map((line, i) => {
      const fields = line.split('|');
      if (fields.length !== count || fields.some(f => !f.trim())) throw new Error(`${file}:${i + 2}: invalid fields`);
      return fields;
    });
}

export function loadQuestions() {
  const questions = [];
  for (const subject of SUBJECTS) {
    for (const [topic,prompt,answer,explanation] of rows(subject.id, 4)) {
      questions.push({subject:subject.id, topic, prompt, answer, explanation, kind:'original', format:'text', source:subject.evidence, answerStatus:'提供資料の出題範囲から作成した編集問題'});
    }
  }
  for (const [subject,topic,prompt,answer,explanation,source,image,answerStatus] of rows('past',8)) {
    questions.push({subject,topic,prompt,answer,explanation,source,image,answerStatus,kind:'past',format:'image'});
  }
  for (const [subject,topic,prompt,answer,explanation,source] of rows('reproduced',6)) {
    questions.push({subject,topic,prompt,answer,explanation,source,kind:'past',format:'reproduced',answerStatus:'再現記録をもとに編集した参考解答（元画像なし）'});
  }
  const expansions = JSON.parse(readFileSync(new URL('../content/expanded.json', import.meta.url), 'utf8'));
  for (const {questions:items, ...group} of expansions) {
    for (const [prompt,answer,explanation] of items) {
      questions.push({...group,prompt,answer,explanation,kind:'original',format:group.image?'image':'text',answerStatus:'参考解答（提供資料の別項目・条件から作成したオリジナル問題）'});
    }
  }
  const papers = JSON.parse(readFileSync(new URL('../content/specialist-sources.json', import.meta.url), 'utf8'));
  for (const [year,paper,number,subject,prompt,answer,explanation,refs] of rows('specialist',8)) {
    const source = papers.find(p=>p.year===Number(year)&&p.paper===paper);
    const item = source?.items.find(q=>q.number===Number(number));
    if (!item || item.status!=='included' || item.subject!==subject) throw new Error(`Missing specialist source: ${year}/${paper}/${number}`);
    questions.push({id:`specialist-${year}-${paper}-${number}`,subject,topic:item.topic,prompt,answer,explanation,
      kind:'specialist',format:'text',year:Number(year),paper,number:Number(number),refs:refs.split(','),
      source:`第${source.round}回（${year}年）眼科専門医試験 ${paper==='ippan'?'一般':'臨床'} 問${number}：${item.topic}`,
      sourceUrl:`${source.url}#${item.anchor}`,originalUrl:'https://www.nichigan.or.jp/senmon/purpose/examination.html',
      answerStatus:'参考解答（専門医試験の出題論点を一問一答に再構成・公式解答ではありません）'});
  }
  return questions.map(q => ({id:`${q.subject}-${createHash('sha256').update(q.kind+q.prompt).digest('hex').slice(0,12)}`, ...q}));
}
