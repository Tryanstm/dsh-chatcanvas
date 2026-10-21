import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function validateReleaseRequest(request,version){
 if(!request||Object.keys(request).sort().join(',')!=='sourceCommit,tag')throw Error('Expected only tag and sourceCommit');
 if(!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?$/.test(version)||request.tag!=='v'+version)throw Error('Release tag must match the package version');
 if(typeof request.sourceCommit!=='string'||!(/^[a-f0-9]{40}$/).test(request.sourceCommit))throw Error('Release source must be a full commit SHA');
 return {tag:request.tag,source:request.sourceCommit,prerelease:version.includes('-')};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.env.GITHUB_REPOSITORY!=='Tryanstm/dsh-chatcanvas')throw Error('Publishing is limited to the requested repository');
 const result=validateReleaseRequest(JSON.parse(fs.readFileSync('.github/release-request.json','utf8')),JSON.parse(fs.readFileSync('package.json','utf8')).version);
 if(!process.env.GITHUB_OUTPUT)throw Error('This entry point requires GitHub Actions');
 fs.appendFileSync(process.env.GITHUB_OUTPUT,Object.entries(result).map(([key,value])=>key+'='+value+'\n').join(''));
}
