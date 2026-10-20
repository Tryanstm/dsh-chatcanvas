import {z} from 'zod';
export const PluginPreferences=z.object({
 nativeComposer:z.boolean().default(true),richMessages:z.boolean().default(true),streamAnimation:z.boolean().default(true),
 renderer:z.object({componentSize:z.number().min(100).max(1200).default(300),contentMaxWidth:z.number().min(200).max(2400).default(952),uiMaxHeight:z.number().min(100).max(24000).default(24000),showDeleteButtons:z.boolean().default(true),showAskSidebar:z.boolean().default(false),showFormatToolbar:z.boolean().default(false),programSlots:z.array(z.boolean()).length(5).default([true,true,false,false,false]),aiSlots:z.array(z.boolean()).length(5).default([true,false,false,false,false]),recommendationTimeoutMs:z.number().min(1000).max(120000).default(20000),maxReviewCorrections:z.number().int().min(0).max(3).default(1)}).strict().default({}),
}).strict();
export type PluginPreferences=z.infer<typeof PluginPreferences>;
export const defaultPluginPreferences=()=>PluginPreferences.parse({});
/** Only recommendation counts are user-editable presentation preferences. */
export function normalizePluginPreferences(input:unknown):PluginPreferences{
 const parsed=PluginPreferences.parse(input),defaults=defaultPluginPreferences();
 const slots=(values:boolean[])=>Array.from({length:5},(_,i)=>i<values.filter(Boolean).length);
 return {...defaults,renderer:{...defaults.renderer,programSlots:slots(parsed.renderer.programSlots),aiSlots:slots(parsed.renderer.aiSlots)}};
}
