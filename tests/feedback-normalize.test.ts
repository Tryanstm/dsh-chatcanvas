import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMathInput} from '../src/math/normalize';
import {parseEquation} from '../src/math/parser';
test('完整规范化口述判别式，保留变量大小写',()=>{
 assert.equal(normalizeMathInput('德尔塔等于B平减4AC'),'Δ=B^2-4AC');
});
test('常见单字参数连写按乘法解释',()=>{
 assert.equal(parseEquation('y=ax+b').evaluate({a:2,x:3,b:1}),7);
});
