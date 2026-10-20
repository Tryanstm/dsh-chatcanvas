/** RIFF SoundFont 2 PCM reader. The original bank remains a separately licensed asset. */
export type SampleRegion={sample:number;start:number;end:number;loopStart:number;loopEnd:number;rate:number;root:number;correction:number;generators:Map<number,number>};
type Header={start:number;end:number;loopStart:number;loopEnd:number;rate:number;root:number;correction:number};
type Zone=Map<number,number>;
export class SoundFont {
 private view:DataView;private pcm=0;private samples:Header[]=[];private presets=new Map<number,Zone[]>();private instruments:Zone[][]=[];
 constructor(bytes:Uint8Array){
  this.view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const v=this.view;
  const str=(p:number,n:number)=>String.fromCharCode(...bytes.subarray(p,p+n));
  if(bytes.length<12||str(0,4)!=='RIFF'||str(8,4)!=='sfbk'||v.getUint32(4,true)+8!==bytes.length)throw Error('无效的 SF2 音源');
  const chunks=new Map<string,{at:number;size:number}>();
  const scan=(at:number,end:number,depth:number)=>{if(depth>3)throw Error('SF2 嵌套过深');while(at+8<=end){const size=v.getUint32(at+4,true),next=at+8+size;if(next>end)throw Error('SF2 数据越界');const tag=str(at,4);if(tag==='LIST'){if(size<4)throw Error('SF2 LIST 无效');scan(at+12,next,depth+1);}else chunks.set(tag,{at:at+8,size});at=next+(size&1);}};scan(12,bytes.length,0);
  const table=(name:string,width:number)=>{const c=chunks.get(name);if(!c||!c.size||c.size%width)throw Error('SF2 缺少或损坏 '+name);return {at:c.at,count:c.size/width};};
  const pcm=table('smpl',2);this.pcm=pcm.at;const sh=table('shdr',46);
  for(let i=0;i<sh.count-1;i++){const p=sh.at+i*46;const h={start:v.getUint32(p+20,true),end:v.getUint32(p+24,true),loopStart:v.getUint32(p+28,true),loopEnd:v.getUint32(p+32,true),rate:v.getUint32(p+36,true),root:v.getUint8(p+40),correction:v.getInt8(p+41)};if(h.start>=h.end||h.end>pcm.count||h.rate<400||h.rate>192000)throw Error('SF2 采样范围无效');this.samples.push(h);}
  const bags=(name:string,gen:string,first:number,last:number)=>{const b=table(name,4),g=table(gen,4),out:Zone[]=[];if(first>last||last>=b.count)throw Error('SF2 分区范围无效');for(let i=first;i<last;i++){const a=v.getUint16(b.at+i*4,true),z=v.getUint16(b.at+(i+1)*4,true);if(a>z||z>g.count)throw Error('SF2 参数越界');const zone=new Map<number,number>();for(let j=a;j<z;j++){const p=g.at+j*4;zone.set(v.getUint16(p,true),v.getInt16(p+2,true));}out.push(zone);}return out;};
  const inst=table('inst',22);for(let i=0;i<inst.count-1;i++)this.instruments.push(bags('ibag','igen',v.getUint16(inst.at+i*22+20,true),v.getUint16(inst.at+(i+1)*22+20,true)));
  const ph=table('phdr',38);for(let i=0;i<ph.count-1;i++){const p=ph.at+i*38;if(v.getUint16(p+22,true)===0)this.presets.set(v.getUint16(p+20,true),bags('pbag','pgen',v.getUint16(p+24,true),v.getUint16(p+62,true)));}
 }
 regions(program:number,key:number,velocity:number):SampleRegion[]{
  const out:SampleRegion[]=[];let pg:Zone=new Map();
  const matches=(z:Zone)=>[43,44].every(op=>{const r=z.get(op);const x=op===43?key:velocity;return r===undefined||(x>=(r&255)&&x<=((r>>>8)&255));});
  for(const p of this.presets.get(program)||[]){if(!p.has(41)){pg=p;continue;}const preset=new Map([...pg,...p]);if(!matches(preset))continue;let ig:Zone=new Map();for(const i of this.instruments[p.get(41)!]||[]){if(!i.has(53)){ig=i;continue;}const instrument=new Map([...ig,...i]);if(!matches(instrument))continue;const h=this.samples[instrument.get(53)!];if(!h)throw Error('SF2 采样索引无效');const g=new Map(instrument);for(const [op,amount]of preset)if(![41,43,44].includes(op))g.set(op,(g.get(op)||0)+amount);const offset=(fine:number,coarse:number)=>(g.get(fine)||0)+(g.get(coarse)||0)*32768;const start=h.start+offset(0,4),end=h.end+offset(1,12);if(start<0||end<=start||this.pcm+end*2>this.view.byteLength)throw Error('SF2 分区采样越界');out.push({sample:instrument.get(53)!,...h,start,end,loopStart:h.loopStart+offset(2,45),loopEnd:h.loopEnd+offset(3,50),generators:g});}}
  return out;
 }
 pcmData(region:SampleRegion){const data=new Float32Array(region.end-region.start);for(let i=0;i<data.length;i++)data[i]=this.view.getInt16(this.pcm+(region.start+i)*2,true)/32768;return data;}
}
declare const __DSER_DEFAULT_SF2__:string;
let bank:SoundFont|undefined;
export function configureSampleBank(bytes:Uint8Array){bank=new SoundFont(bytes);}
export function sampleBank(){if(bank)return bank;if(typeof __DSER_DEFAULT_SF2__==='undefined')throw Error('采样音源未载入，请使用完整安装包');const decoded=atob(__DSER_DEFAULT_SF2__);const bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0));return bank=new SoundFont(bytes);}
export const timecents=(value:number)=>value<=-32768?0:Math.min(100,2**(value/1200));
export function sampleRateRatio(r:SampleRegion,key:number){const g=r.generators;return 2**(((g.get(46)??key)-(g.get(58)??r.root))*(g.get(56)??100)/1200+(g.get(51)||0)/12+((g.get(52)||0)+r.correction)/1200);}
