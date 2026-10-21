import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateReleaseRequest} from '../scripts/release-request.mjs';
test('Release requires an explicit matching tag and immutable source commit',()=>{
 const request={tag:'v1.4.0-rc.12',sourceCommit:'a'.repeat(40)};
 assert.deepEqual(validateReleaseRequest(request,'1.4.0-rc.12'),{tag:request.tag,source:request.sourceCommit,prerelease:true});
 assert.throws(()=>validateReleaseRequest({...request,sourceCommit:'main'},'1.4.0-rc.12'));
 assert.throws(()=>validateReleaseRequest({...request,tag:'v1.4.0'},'1.4.0-rc.12'));
 assert.throws(()=>validateReleaseRequest({...request,token:'not-accepted'},'1.4.0-rc.12'));
 assert.equal(validateReleaseRequest({...request,tag:'v1.4.0'},'1.4.0').prerelease,false);
});
