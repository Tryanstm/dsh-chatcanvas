import {readFileSync} from 'node:fs';import {configureSampleBank} from '../src/music/soundfont';
configureSampleBank(readFileSync('vendor/soundfonts/TimGM6mb.sf2'));
export class AudioFixture {
 static latest:AudioFixture;static offlineFrames=0;currentTime=0;destination={};sampleRate=44100;
 stops:(number|undefined)[]=[];ramps:{value:number;time:number}[]=[];starts:{time:number;offset:number}[]=[];rates:number[]=[];pcm:Float32Array[]=[];
 constructor(_channels?:number,frames?:number){AudioFixture.latest=this;if(frames)AudioFixture.offlineFrames=frames;}
 resume=async()=>{};close=async()=>{};
 param(){const owner=this;return {value:0,setValueAtTime(value:number,time:number){owner.ramps.push({value,time});},linearRampToValueAtTime(value:number,time:number){owner.ramps.push({value,time});},exponentialRampToValueAtTime(value:number,time:number){owner.ramps.push({value,time});}};}
 createGain(){return {connect(){},disconnect(){},gain:this.param()};}
 createBiquadFilter(){return {type:'',frequency:this.param(),Q:{value:0},connect(){},disconnect(){}};}
 createStereoPanner(){return {pan:{value:0},connect(){},disconnect(){}};}
 createDelay(){return {delayTime:{value:0},connect(){},disconnect(){}};}
 createBuffer(_channels:number,frames:number,rate:number){const owner=this;return {duration:frames/rate,copyToChannel(data:Float32Array){owner.pcm.push(data);}};}
 createBufferSource(){const owner=this;return {buffer:null,playbackRate:{set value(v:number){owner.rates.push(v);},get value(){return owner.rates.at(-1)!;}},connect(){},disconnect(){},start(time:number,offset=0){owner.starts.push({time,offset});},stop(time?:number){owner.stops.push(time);},addEventListener(){}};}
 createOscillator(){throw Error('PCM 采样回归：主声部不能退回振荡器');}
 async startRendering(){return {numberOfChannels:2,length:1,sampleRate:44100,getChannelData:()=>new Float32Array(1)};}
}
