import {id,MathItemSchema,type MathSpec} from '../protocol';
type P={x:number;y:number};
const square=(x:number)=>`(${x})^2`;
/** Geometric constructions have explicit point roles and never fit noisy points. */
export function geometricItem(kind:'ellipse-axes'|'ellipse-focus'|'circle',points:P[]):MathSpec['items'][number]{
 let expression='';if(kind==='circle'){if(points.length!==3)throw new Error('圆需要三个不共线的点');const [a,b,c]=points as [P,P,P],d=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));if(Math.abs(d)<1e-10)throw new Error('三个点共线，不能确定圆');const a2=a.x*a.x+a.y*a.y,b2=b.x*b.x+b.y*b.y,c2=c.x*c.x+c.y*c.y,h=(a2*(b.y-c.y)+b2*(c.y-a.y)+c2*(a.y-b.y))/d,k=(a2*(c.x-b.x)+b2*(a.x-c.x)+c2*(b.x-a.x))/d,r=Math.hypot(a.x-h,a.y-k);expression=`(x-(${h}))^2+(y-(${k}))^2=${square(r)}`;
 }else{if(points.length!==3)throw new Error(kind==='ellipse-focus'?'依次选择两个焦点和一个线上点':'依次选择中心、长轴端点和短轴端点');const [p,q,r]=points as [P,P,P];let h:number,k:number,a:number,b:number,angle:number;if(kind==='ellipse-focus'){h=(p.x+q.x)/2;k=(p.y+q.y)/2;const c=Math.hypot(q.x-p.x,q.y-p.y)/2;a=(Math.hypot(r.x-p.x,r.y-p.y)+Math.hypot(r.x-q.x,r.y-q.y))/2;if(a<=c+1e-10)throw new Error('线上点不能在两焦点之间形成退化椭圆');b=Math.sqrt(a*a-c*c);angle=Math.atan2(q.y-p.y,q.x-p.x);}else{h=p.x;k=p.y;a=Math.hypot(q.x-h,q.y-k);b=Math.hypot(r.x-h,r.y-k);if(a<1e-9||b<1e-9)throw new Error('轴长必须大于零');if(Math.abs((q.x-h)*(r.x-h)+(q.y-k)*(r.y-k))>1e-7*a*b)throw new Error('长短轴必须互相垂直，请重新选点');angle=Math.atan2(q.y-k,q.x-h);}const cos=Math.cos(angle),sin=Math.sin(angle),u=`((x-(${h}))*(${cos})+(y-(${k}))*(${sin}))`,v=`(-(x-(${h}))*(${sin})+(y-(${k}))*(${cos}))`;expression=`${u}^2/${square(a)}+${v}^2/${square(b)}=1`;}
 return MathItemSchema.parse({id:id(),kind:'implicit',expression,color:'#262626'});
}
