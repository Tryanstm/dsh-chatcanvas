import {TableSchema} from '../table/model';
import {z} from 'zod';
import {zodToJsonSchema,ignoreOverride} from 'zod-to-json-schema';
import {CanvasSchema,UISchema,UINodeSchema,MathSchema} from '../protocol';
import {MusicSchema} from '../music/model';
import {ProgramSchema,StepSchema,ExpressionSchema} from '../ui/blocks';
import {UIStateSchema} from '../ui/state';
// The model and runtime share the authoritative protocol, including recursive programs.
function flattenTupleItemsForModel(node: unknown): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const entry of node) flattenTupleItemsForModel(entry);
    return;
  }
  const schema = node as Record<string, any>;
  if (Array.isArray(schema.items)) {
    if (schema.items.length === 0) {
      schema.items = {};
    } else {
      const entries = schema.items;
      const first = entries[0];
      const firstJson = JSON.stringify(first);
      schema.items = entries.every((entry: unknown) => JSON.stringify(entry) === firstJson)
        ? first
        : { anyOf: entries };
    }
  }
  for (const key of ['items', 'additionalItems', 'contains', 'propertyNames', 'not', 'if', 'then', 'else', 'additionalProperties', 'unevaluatedItems', 'unevaluatedProperties']) {
    const child = schema[key];
    if (child && typeof child === 'object') flattenTupleItemsForModel(child);
  }
  for (const key of ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas']) {
    const children = schema[key];
    if (children && typeof children === 'object') {
      for (const child of Object.values(children)) flattenTupleItemsForModel(child);
    }
  }
  for (const key of ['anyOf', 'oneOf', 'allOf', 'prefixItems']) {
    const children = schema[key];
    if (Array.isArray(children)) {
      for (const child of children) flattenTupleItemsForModel(child);
    }
  }
}

const schema=zodToJsonSchema(z.object({canvas:CanvasSchema}).strict(),{definitionPath:'$defs',definitions:{UIDocument:UISchema,uiNode:UINodeSchema,Math:MathSchema,Music:MusicSchema,Table:TableSchema,Program:ProgramSchema,Step:StepSchema,Expression:ExpressionSchema},effectStrategy:'input',override:(def)=>def===UIStateSchema._def?{type:'object',additionalProperties:true,description:'Bounded local JSON state: <=100 root fields, depth <=6, <=64 KiB; reserved __dser names are forbidden.'}:ignoreOverride}) as any;
delete schema.$schema;
flattenTupleItemsForModel(schema);
// New canvas tools no longer offer the retired standalone table component.
const variants=schema.properties.canvas.properties.objects.items.anyOf;schema.properties.canvas.properties.objects.items.anyOf=variants.filter((v:any)=>v.properties?.type?.const!=='table'&&!v.properties?.type?.enum?.includes('table'));delete schema.$defs.Table;
export const TOOL_DEFS=schema.$defs;
export const CANVAS_PARAMETERS=schema;
export const UI_DOCUMENT_PARAMETERS={$ref:'#/$defs/UIDocument'};
export const UI_NODE_PARAMETERS=TOOL_DEFS.uiNode;
export const MATH_SPEC_PARAMETERS={$ref:'#/$defs/Math'};
export const MUSIC_SPEC_PARAMETERS={$ref:'#/$defs/Music'};
