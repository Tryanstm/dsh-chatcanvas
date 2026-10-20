import {compileSafe} from './parser';
import type {MathSpec} from '../protocol';
export function parameterScope(item:MathSpec['items'][number],parameters:Record<string,number>){const scope={...parameters},pending=Object.entries(item.parameterBindings||{});for(let pass=0;pass<=pending.length;pass++)for(const [key,expression]of pending){const c=compileSafe(expression,[]);if(c.parameters.every(p=>Number.isFinite(scope[p])))scope[key]=c.evaluate(scope);}return scope;}
