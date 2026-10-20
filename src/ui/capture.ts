import {toPng} from 'html-to-image';
// Trusted renderer code bundled into the opaque iframe; custom scripts run only in QuickJS.
(globalThis as any).__dserCapture=async(root:HTMLElement)=>{await document.fonts.ready;const scale=Math.min(1,1600/innerWidth,1600/innerHeight);return toPng(root,{backgroundColor:'#ffffff',skipFonts:true,pixelRatio:1,width:innerWidth,height:innerHeight,canvasWidth:Math.max(1,Math.round(innerWidth*scale)),canvasHeight:Math.max(1,Math.round(innerHeight*scale)),style:{animation:'none',transition:'none',overflow:'hidden'}});};
