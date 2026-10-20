import type {CanvasObject} from '../protocol';
/** Like CSS z-index: larger numbers paint later; equal layers retain insertion order. */
export function sceneStack(objects:CanvasObject[]){return objects.map((object,index)=>({object,index})).sort((a,b)=>a.object.z-b.object.z||a.index-b.index).map(row=>row.object);}
