import React from 'react';
import {PublishedCanvas} from './PublishedCanvas';import {PublishedDocument} from './PublishedDocument';
export {creationDefinition} from './creation-definition';
export function CreationView({node,...props}:any){return <>{node.jobs.map((job:any)=>job.kind==='canvas'?<PublishedCanvas key={job.id} {...props} node={job}/>:<PublishedDocument key={job.id} {...props} node={job}/>)}</>;}
