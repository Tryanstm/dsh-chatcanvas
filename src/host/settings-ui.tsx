import React,{useEffect,useState,useSyncExternalStore} from 'react';
import {defaultPluginPreferences,normalizePluginPreferences,type PluginPreferences} from '../plugin-config';
import {configureRenderer} from '../settings';
import {version} from '../../package.json';
let value=defaultPluginPreferences();const listeners=new Set<()=>void>();
export const pluginPreferences=()=>value;
export function usePluginPreferences(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},pluginPreferences,pluginPreferences);}
function applyPreferences(next:PluginPreferences){value=normalizePluginPreferences(next);configureRenderer(value.renderer);listeners.forEach(fn=>fn());}
export function registerSettingsUI(ctx:any){
 ctx.effect(()=>{if(typeof fetch!=='function')return()=>{};const abort=new AbortController();void fetch('api/chatcanvas.settings',{signal:abort.signal}).then(r=>r.ok?r.json():Promise.reject(Error('设置不可用'))).then(v=>applyPreferences(v.preferences)).catch(()=>{});return()=>abort.abort();});
 return ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'chatcanvas',order:54,label:()=> '对话画布 · ChatCanvas'},SettingsPanel));
}
function SettingsPanel(){
 const [draft,setDraft]=useState(value),[revision,setRevision]=useState(0),[notice,setNotice]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[countPicker,setCountPicker]=useState<'programSlots'|'aiSlots'|null>(null);
 const load=async()=>{setLoading(true);try{const response=await fetch('api/chatcanvas.settings');if(!response.ok)throw Error('读取设置失败');const v=await response.json();setDraft(normalizePluginPreferences(v.preferences));setRevision(v.revision);setNotice(v.error||'');applyPreferences(v.preferences);}catch(e){setNotice(String(e));}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 useEffect(()=>{if(!countPicker)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setCountPicker(null);};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[countPicker]);
 const save=async()=>{setSaving(true);try{const response=await fetch('api/chatcanvas.settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,preferences:normalizePluginPreferences(draft)})});const v=await response.json();if(!response.ok)throw Error(v.error||'保存失败');setRevision(v.revision);setDraft(normalizePluginPreferences(v.preferences));applyPreferences(v.preferences);setNotice('设置已保存并生效。');}catch(e){setNotice(String(e));}finally{setSaving(false);}};
 const countLabel=(key:'programSlots'|'aiSlots')=>key==='programSlots'?'程序推荐选项':'AI 推荐选项';
 return <section className="dser-settings" aria-label="对话画布 · ChatCanvas设置">
 <h2>对话画布 · ChatCanvas</h2><small>版本 {version}</small>
 <fieldset disabled={loading||saving}><legend>推荐</legend>
 {(['programSlots','aiSlots'] as const).map(key=><div className="dser-setting-count" key={key}><span>{countLabel(key)}</span><button type="button" aria-label={countLabel(key)+'数量'} aria-haspopup="dialog" onClick={()=>setCountPicker(key)}>{draft.renderer[key].filter(Boolean).length} 项</button></div>)}
 </fieldset>
 {countPicker&&<div className="dser-setting-modal-backdrop" onClick={()=>setCountPicker(null)}><div className="dser-setting-modal" role="dialog" aria-modal="true" aria-label={countLabel(countPicker)+'数量'} onClick={e=>e.stopPropagation()}><p>{countLabel(countPicker)}：选择启用几项</p>{Array.from({length:6},(_,n)=><button type="button" autoFocus={n===draft.renderer[countPicker].filter(Boolean).length} aria-pressed={n===draft.renderer[countPicker].filter(Boolean).length} key={n} onClick={()=>{setDraft(v=>({...v,renderer:{...v.renderer,[countPicker]:Array.from({length:5},(_,i)=>i<n)}}));setCountPicker(null);}}>{n} 项</button>)}<button type="button" onClick={()=>setCountPicker(null)}>取消</button></div></div>}
 <div className="dser-toolbar"><button disabled={loading||saving} onClick={()=>void save()}>{saving?'保存中…':'保存设置'}</button><button disabled={saving} onClick={()=>void load()}>重新读取</button></div><p role="status">{notice}</p>
 </section>;
}
