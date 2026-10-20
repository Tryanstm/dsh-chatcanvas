import fs from 'node:fs';import {createHash} from 'node:crypto';
const dir='vendor/soundfonts/',bytes=fs.readFileSync(dir+'TimGM6mb.sf2'),meta=JSON.parse(fs.readFileSync(dir+'SOURCE.json','utf8'));
const hash=createHash('sha256').update(bytes).digest('hex');if(hash!==meta.sha256)throw Error('Sample bank hash mismatch');
export const soundfontDefine={__DSER_DEFAULT_SF2__:JSON.stringify(bytes.toString('base64'))};
export function stageSoundfont(){fs.mkdirSync('dist/soundfonts',{recursive:true});for(const n of ['TimGM6mb.sf2','COPYRIGHT.debian','COPYING.GPL-2','SOURCE.json'])fs.copyFileSync(dir+n,'dist/soundfonts/'+n);}
