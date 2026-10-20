import React from 'react';
import {questionReference} from './canvas-question-protocol';
import {decorateEntries} from './decorate-client';
import {NativeCanvasQuestion} from './NativeCanvasQuestion';
export {CanvasQuestion} from './QuestionPanel';
export function registerCanvasQuestionUI(ctx:any){
 return decorateEntries(ctx,'conversation.composer',e=>e.options.locale==='question'||e.locale==='question'||!!e.options.store&&!!e.options.children?.['conversation.plan-review.actions'],Native=>function Questions(props:any){return props.matched?.questions?.some((q:any)=>questionReference(q.detail))?<NativeCanvasQuestion Native={Native} props={props}/>:<Native {...props}/>;});
}
