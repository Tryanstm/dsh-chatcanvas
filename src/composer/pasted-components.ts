import {Fragment,Slice,type Node} from '@tiptap/pm/model';
import {editableComponent} from '../renderer/component-clipboard';
/** Copy whole component identities while retaining surrounding rich text and open depths. */
export function copyPastedComponents(slice:Slice){const copy=(node:Node):Node=>{if(node.attrs.document){const value=editableComponent(node.toJSON());return node.type.create(value.attrs,node.content,node.marks);}if(node.isText||!node.content.size)return node;return node.copy(Fragment.fromArray(node.content.content.map(copy)));};return new Slice(Fragment.fromArray(slice.content.content.map(copy)),slice.openStart,slice.openEnd);}
