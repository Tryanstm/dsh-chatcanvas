let leases=0,previous='';
/** Fullscreen views share only a scroll-lock lease, never chat or canvas state. */
export function lockPageScroll(){if(leases++===0){previous=document.body.style.overflow;document.body.style.overflow='hidden';}let released=false;return()=>{if(released)return;released=true;if(--leases===0)document.body.style.overflow=previous;};}
export function overlayContainer():HTMLElement{return [...document.querySelectorAll<HTMLDialogElement>('dialog.dser-fullscreen-dialog[open],dialog[data-dser-overlay][open]')].at(-1)||document.body;}
