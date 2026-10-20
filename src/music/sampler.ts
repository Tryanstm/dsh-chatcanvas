import {sampleBank,sampleRateRatio,timecents,type SampleRegion} from './soundfont';
import type {MusicNote,MusicTrack} from './model';
const cache=new WeakMap<BaseAudioContext,WeakMap<object,Map<string,AudioBuffer>>>();
function buffer(ctx:BaseAudioContext,r:SampleRegion){const bank=sampleBank();let banks=cache.get(ctx);if(!banks)cache.set(ctx,banks=new WeakMap());let samples=banks.get(bank);if(!samples)banks.set(bank,samples=new Map());const key=`${r.start}:${r.end}:${r.rate}`;let b=samples.get(key);if(!b){b=ctx.createBuffer(1,r.end-r.start,r.rate);b.copyToChannel(bank.pcmData(r),0);samples.set(key,b);}return b;}
function envelope(r:SampleRegion,pitch:number){const g=r.generators;return {delay:timecents(g.get(33)??-12000),attack:timecents(g.get(34)??-12000),hold:timecents((g.get(35)??-12000)+(g.get(39)||0)*(60-pitch)),decay:timecents((g.get(36)??-12000)+(g.get(40)||0)*(60-pitch)),sustain:10**(-(g.get(37)||0)/200),release:Math.max(.005,timecents(g.get(38)??-12000))};}
function regions(note:MusicNote,track:MusicTrack){return sampleBank().regions(note.instrument??track.instrument,note.pitch,Math.round(note.velocity*127));}
function lifetime(r:SampleRegion,note:MusicNote,duration:number){const loop=(r.generators.get(54)||0)&1;const natural=(r.end-r.start)/r.rate/sampleRateRatio(r,note.pitch);return loop?duration+envelope(r,note.pitch).release:Math.min(natural,duration+envelope(r,note.pitch).release);}
export function sampledLifetime(note:MusicNote,track:MusicTrack,duration:number){return Math.max(.01,...regions(note,track).map(r=>lifetime(r,note,duration)));}
export function sampledVoice(ctx:BaseAudioContext,destination:AudioNode,note:MusicNote,track:MusicTrack,start:number,duration:number,age=0){
 const cleanup:(()=>void)[]=[];
 for(const r of regions(note,track)){
  const e=envelope(r,note.pitch),total=duration+age,end=lifetime(r,note,total);if(age>=end)continue;
  const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner(),filter=ctx.createBiquadFilter();source.buffer=buffer(ctx,r);source.playbackRate.value=sampleRateRatio(r,note.pitch);
  source.loop=!!((r.generators.get(54)||0)&1)&&r.loopStart>=r.start&&r.loopEnd<=r.end&&r.loopEnd>r.loopStart;
  source.loopStart=(r.loopStart-r.start)/r.rate;source.loopEnd=(r.loopEnd-r.start)/r.rate;
  filter.type='lowpass';filter.Q.value=(r.generators.get(9)||0)/10;const filterBase=r.generators.get(8)??13500,filterDepth=r.generators.get(11)||0;const cutoff=(value:number)=>Math.max(20,Math.min(ctx.sampleRate*.45,8.176*2**(value/1200)));filter.frequency.value=cutoff(filterBase);if(filterDepth){const attack=timecents(r.generators.get(26)??-12000),hold=attack+timecents(r.generators.get(27)??-12000),decay=hold+timecents(r.generators.get(28)??-12000),sustain=1-Math.min(1000,r.generators.get(29)||0)/1000;const amount=(t:number)=>t<attack?t/attack:t<hold?1:t<decay?1-(1-sustain)*(t-hold)/Math.max(1e-9,decay-hold):sustain;filter.frequency.setValueAtTime(cutoff(filterBase+filterDepth*amount(age)),start);for(const t of [attack,hold,decay])if(t>age&&t<total)filter.frequency.exponentialRampToValueAtTime(cutoff(filterBase+filterDepth*amount(t)),start+t-age);}pan.pan.value=Math.max(-1,Math.min(1,(r.generators.get(17)||0)/500));
  source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(destination);
  const peak=note.velocity**2*track.volume*.65*10**(-(r.generators.get(48)||0)/200);
  const attack=e.delay+e.attack,hold=attack+e.hold,decay=hold+e.decay;
  const base=(t:number)=>t<e.delay?0:t<attack?(t-e.delay)/Math.max(e.attack,1e-9):t<hold?1:t<decay?10**(Math.log10(Math.max(1e-6,e.sustain))*(t-hold)/Math.max(e.decay,1e-9)):e.sustain;
  const level=(t:number)=>peak*(t<=total?base(t):base(total)*10**(-5*(t-total)/e.release));
  gain.gain.setValueAtTime(Math.max(1e-7,level(age)),start);
  for(const t of [...new Set([e.delay,attack,hold,decay,total,end])].sort((a,b)=>a-b))if(t>age&&t<=end){const value=Math.max(1e-7,level(t));if(t<=attack)gain.gain.linearRampToValueAtTime(value,start+t-age);else gain.gain.exponentialRampToValueAtTime(value,start+t-age);}
  let offset=age*source.playbackRate.value;if(source.loop&&offset>=source.loopEnd)offset=source.loopStart+(offset-source.loopStart)%(source.loopEnd-source.loopStart);if(offset>=source.buffer.duration)continue;
  source.start(start,offset);source.stop(start+end-age);
  let wet:GainNode|undefined,delay:DelayNode|undefined;if(note.reverb){delay=ctx.createDelay(1);wet=ctx.createGain();delay.delayTime.value=.09;wet.gain.value=note.reverb*.25;pan.connect(delay);delay.connect(wet);wet.connect(destination);}
  let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();delay?.disconnect();wet?.disconnect();};source.addEventListener('ended',dispose,{once:true});cleanup.push(()=>{try{source.stop();}catch{}dispose();});
 }
 return ()=>cleanup.forEach(f=>f());
}
