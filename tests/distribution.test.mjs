import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {installManifest,includeInstallFile,assertPrebuiltPackage} from '../scripts/package-stage.mjs';
import {publishedMarketIndex,refreshMarketplace} from '../scripts/marketplace.mjs';

const source=JSON.parse(fs.readFileSync('package.json','utf8'));
const locales={en:JSON.parse(fs.readFileSync('locale/en.json','utf8')),zh:JSON.parse(fs.readFileSync('locale/zh.json','utf8'))};
const integrity='sha512-'+Buffer.alloc(64,1).toString('base64');
const icon=fs.readFileSync(source.icon);
function registry() {
  const manifest=installManifest(source);
  return {name:manifest.name,time:{[manifest.version]:'2026-10-22T00:00:00.000Z'},versions:{[manifest.version]:{...manifest,dist:{integrity,tarball:`https://registry.npmjs.org/dsh-chatcanvas/-/dsh-chatcanvas-${manifest.version}.tgz`}}}};
}

test('Installation stage keeps host compatibility metadata but no install-time build or development payload',()=>{
  const manifest=installManifest(source);
  assert.equal(manifest.scripts,undefined);
  assert.equal(manifest.dependencies,undefined);
  assert.equal(manifest.devDependencies,undefined);
  assert.deepEqual(manifest.peerDependencies,source.peerDependencies);
  assert.equal(includeInstallFile('dist/preview/app.js'),false);
  assert.equal(includeInstallFile('dist/index.js.map'),false);
  assert.equal(includeInstallFile('dist/transcription/tfjs/dist/tf.min.js'),true);
  assert.equal(includeInstallFile('dist/soundfonts/TimGM6mb.sf2'),true);
});

test('Prebuilt package rejects missing exports, wrong loader identity and source lifecycle hooks',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'chatcanvas-stage-'));
  try {
    const manifest={...installManifest(source),exports:{'.':'./dist/index.js','./client':'./dist/client.js'}};
    fs.mkdirSync(path.join(root,'dist'));
    fs.writeFileSync(path.join(root,'package.json'),JSON.stringify(manifest));
    fs.writeFileSync(path.join(root,'cordis.patch.yml'),"- insert:\n    - id: dsh-chatcanvas\n      name: 'dsh-chatcanvas'\n");
    fs.writeFileSync(path.join(root,'dist/index.js'),'export const name="dsh-chatcanvas";');
    assert.throws(()=>assertPrebuiltPackage(root));
    fs.writeFileSync(path.join(root,'dist/client.js'),'window.__ModuleLoader__.load({id:"wrong-package",factory:()=>({})});');
    assert.throws(()=>assertPrebuiltPackage(root),/Client module ID/);
    fs.writeFileSync(path.join(root,'dist/client.js'),'window.__ModuleLoader__.load({id:"dsh-chatcanvas",factory:()=>({})});');
    assert.equal(assertPrebuiltPackage(root).name,'dsh-chatcanvas');
    fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({...manifest,scripts:{prepare:'some-build'}}));
    assert.throws(()=>assertPrebuiltPackage(root),/prebuilt installation stage/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('Market lists only a real npm bundle matching the reviewed archive and its supported host versions',()=>{
  const result=publishedMarketIndex({manifest:source,registry:registry(),locales,icon,integrity});
  const version=result.plugins[0].versions[0];
  assert.equal(result.plugins[0].name,'dsh-chatcanvas');
  assert.equal(result.plugins[0].title.zh,'对话画布 · ChatCanvas');
  assert.equal(version.version,source.version);
  assert.equal(version.engines.dsh,source.engines.dsh);
  assert.deepEqual(version.source,{type:'npm',registry:'https://registry.npmjs.org/'});
  assert.throws(()=>publishedMarketIndex({manifest:source,registry:{name:source.name,versions:{}},locales,icon,integrity}),/not published/);
  assert.throws(()=>publishedMarketIndex({manifest:source,registry:registry(),locales,icon,integrity:integrity+'wrong'}),/integrity/);
  const wrong=registry();wrong.versions[source.version].repository={url:'https://github.com/unrelated/project.git'};
  assert.throws(()=>publishedMarketIndex({manifest:source,registry:wrong,locales,icon,integrity}),/different repository/);
});

test('Failed registry lookup preserves the previously published market index',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'chatcanvas-market-'));
  const destination=path.join(root,'index.json');fs.writeFileSync(destination,'existing index');
  try {
    await assert.rejects(refreshMarketplace({manifest:source,locales,icon,integrity,destination,fetcher:async()=>({ok:false,status:404})}),/left unchanged/);
    assert.equal(fs.readFileSync(destination,'utf8'),'existing index');
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
