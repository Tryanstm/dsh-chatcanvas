import {buildTraces} from './traces';
import {analyze,constrainItem} from './analysis';
self.onmessage=(event:MessageEvent)=>{try{const data=event.data,result=data.op==='analysis'?analyze(data.spec,data.itemId,data.operation,data.otherId,data.point):data.op==='constrain'?constrainItem(data.item,data.points):buildTraces(data.op==='sample'?data.spec:data);self.postMessage({ok:true,result,requestId:data.requestId});}catch(e){self.postMessage({ok:false,error:String(e),requestId:event.data.requestId});}};
