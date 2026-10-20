export type Point=[number,number];
export function recognizeStroke(points:Point[]){if(points.length<8)return undefined;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),w=maxX-minX,h=maxY-minY,diag=Math.hypot(w,h);if(diag<18)return undefined;
 const a=points[0]!,b=points.at(-1)!,length=points.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-points[i]![0],p[1]-points[i]![1]),0),chord=Math.hypot(b[0]-a[0],b[1]-a[1]);
 if(chord/length>.975){const deviations=points.map(p=>Math.abs((b[1]-a[1])*p[0]-(b[0]-a[0])*p[1]+b[0]*a[1]-b[1]*a[0])/chord);if(Math.max(...deviations)/diag<.035)return {kind:'line' as const,x:minX,y:minY,width:Math.max(1,w),height:Math.max(1,h),points:[a,b]};}
 if(chord>diag*.18||w<15||h<15)return undefined;
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2,radii=points.map(p=>Math.hypot((p[0]-cx)/(w/2),(p[1]-cy)/(h/2))),err=radii.reduce((s,r)=>s+Math.abs(r-1),0)/radii.length;
 if(err<.085)return{kind:w/h>.85&&w/h<1.18?'circle' as const:'ellipse' as const,x:minX,y:minY,width:w,height:h};
 const edgeError=points.reduce((s,p)=>s+Math.min(Math.abs(p[0]-minX),Math.abs(p[0]-maxX),Math.abs(p[1]-minY),Math.abs(p[1]-maxY)),0)/points.length;
 const corners=[[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]];const cornerDistance=corners.map(c=>Math.min(...points.map(p=>Math.hypot(c[0]!-p[0],c[1]!-p[1]))));
 if(edgeError/diag<.045&&Math.max(...cornerDistance)<diag*.18)return{kind:Math.max(...cornerDistance)>diag*.055?'roundrect' as const:Math.abs(w-h)/diag<.07?'square' as const:'rect' as const,x:minX,y:minY,width:w,height:h};return undefined;
}
