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
  return questions.map(q => ({id:`${q.subject}-${createHash('sha256').update(q.kind+q.prompt).digest('hex').slice(0,12)}`, ...q}));
}
