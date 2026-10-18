import { mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadQuestions } from './content.mjs';
const output=new URL('../dist/',import.meta.url);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(new URL('../src/',import.meta.url),output,{recursive:true});
await cp(new URL('../public/',import.meta.url),output,{recursive:true});
const questions=loadQuestions();
await writeFile(new URL('questions.js',output),`export const QUESTIONS = ${JSON.stringify(questions)};\n`);
// Changed asset names prevent an old browser cache from mixing app versions.
const assets=['app.js','model.js','catalog.js','questions.js','style.css'];
const contents=await Promise.all(assets.map(name=>readFile(new URL(name,output),'utf8')));
const revision=createHash('sha256').update(contents.join('\n')).digest('hex').slice(0,12);
const filenames=new Map(assets.map(name=>[name,name.replace('.',`.${revision}.`)]));
const updateLinks=text=>[...filenames].reduce((result,[name,versioned])=>result.replaceAll(`./${name}`,`./${versioned}`),text);
for(let i=0;i<assets.length;i++){
  await writeFile(new URL(filenames.get(assets[i]),output),updateLinks(contents[i]));
  await rm(new URL(assets[i],output));
}
await writeFile(new URL('index.html',output),updateLinks(await readFile(new URL('index.html',output),'utf8')));
await writeFile(new URL('.nojekyll',output),'');
console.log(`Built ${questions.length} questions / ${questions.filter(q=>q.image).length} image questions.`);
