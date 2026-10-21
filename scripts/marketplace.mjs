import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repository='https://github.com/Tryanstm/dsh-chatcanvas';
export function publishedMarketIndex({manifest, registry, locales, icon, integrity}) {
  if(manifest.name!=='dsh-chatcanvas'||registry?.name!==manifest.name) throw Error('The public npm package has not been verified');
  const current=registry.versions?.[manifest.version];
  if(!current) throw Error('The requested version is not published on npm');
  if(integrity&&current.dist?.integrity!==integrity) throw Error('Published archive integrity does not match the reviewed package');
  const records=[];
  for(const [version,pkg] of Object.entries(registry.versions||{})) {
    if(pkg.deprecated||pkg.name!==manifest.name||pkg.version!==version) continue;
    const repo=typeof pkg.repository==='string'?pkg.repository:pkg.repository?.url;
    if(repo?.replace(/^git\+/,'').replace(/\.git$/,'')!==repository) {
      if(version===manifest.version) throw Error('Published version points to a different repository');
      continue;
    }
    if(!pkg.dsh?.bundle?.patch || !/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version)) continue;
    if(pkg.dist?.tarball!==`https://registry.npmjs.org/dsh-chatcanvas/-/dsh-chatcanvas-${version}.tgz`||!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(pkg.dist?.integrity||'')) throw Error('Unexpected npm distribution source');
    const publishTimestamp=Math.floor(Date.parse(registry.time?.[version])/1000);
    if(!Number.isFinite(publishTimestamp)||publishTimestamp<=0) throw Error('Missing npm publication time');
    records.push({version,publishTimestamp,source:{type:'npm',registry:'https://registry.npmjs.org/'},...(pkg.engines?.dsh?{engines:{dsh:pkg.engines.dsh}}:{})});
  }
  if(!records.some(v=>v.version===manifest.version)) throw Error('The published version is not an installable DSH bundle');
  const title=Object.fromEntries(Object.entries(locales).map(([lang,locale])=>[lang,locale.meta.title]));
  const description=Object.fromEntries(Object.entries(locales).map(([lang,locale])=>[lang,locale.meta.description]));
  if(!title.en||!description.en||icon.length>32768) throw Error('Invalid market display metadata');
  return {format:1,title:{en:'ChatCanvas plugins',zh:'对话画布插件源'},description:{en:'Prebuilt ChatCanvas releases maintained by Tryanstm. Third-party plugins for DeepSeek Harness.',zh:'Tryanstm 维护的对话画布预编译包。这是第三方插件源。'},plugins:[{name:manifest.name,title,description,icon:'data:image/svg+xml;base64,'+icon.toString('base64'),author:manifest.author,homepage:manifest.homepage,repository:{url:repository},metadata:{keywords:manifest.keywords},versions:records}]};
}

export async function refreshMarketplace({manifest,locales,icon,integrity,destination,fetcher=fetch}) {
  const response=await fetcher('https://registry.npmjs.org/dsh-chatcanvas',{redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw Error(`npm returned ${response.status}; the existing market index was left unchanged`);
  const index=publishedMarketIndex({manifest,registry:await response.json(),locales,icon,integrity});
  const temporary=destination+'.tmp';
  fs.writeFileSync(temporary,JSON.stringify(index,null,2)+'\n');
  fs.renameSync(temporary,destination);
  return index;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const manifest=JSON.parse(fs.readFileSync('package.json','utf8'));
  const publication=JSON.parse(fs.readFileSync('outputs/npm-publication.json','utf8'));
  if(publication.name!==manifest.name||publication.version!==manifest.version) throw Error('Build the current npm package first');
  await refreshMarketplace({manifest,locales:{en:JSON.parse(fs.readFileSync('locale/en.json','utf8')),zh:JSON.parse(fs.readFileSync('locale/zh.json','utf8'))},icon:fs.readFileSync(manifest.icon),integrity:publication.integrity,destination:'marketplace/index.json'});
  console.log('Market index refreshed from the verified npm publication.');
}
