import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export function registerVisualQuestionSkill(ctx:any){
 ctx.inject(['skills'],(c:any)=>{
  const url=new URL('../skills/dsh-visual-questions/SKILL.md',import.meta.url),candidate={name:'dsh-visual-questions',description:'制作 UI、布局、图画或交互草案并需要确认视觉方案时，使用可编辑画布提问收集修改。',invocation:{modelInvocable:true,userInvocable:true},provider:'chatcanvas',source:'bundled',rank:1000,resourceBase:{kind:'directory',path:fileURLToPath(new URL('../skills/dsh-visual-questions/',import.meta.url))},locator:url};
  return c.skills.registerProvider(()=>({name:'chatcanvas',list:async()=>[candidate],get:async()=>({...candidate,content:await readFile(url,'utf8')})}));
 });
}
