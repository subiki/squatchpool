/** Convert pointer events to canvas coordinates, including CSS scaling and borders. */
export function tablePoint(canvas,event){
 const box=canvas.getBoundingClientRect();
 // clientWidth/Height are absent in minimal browser test doubles; use the
 // measured box there, but prefer the border-free client dimensions in browsers.
 const width=canvas.clientWidth||box.width;
 const height=canvas.clientHeight||box.height;
 const x=event.clientX-box.left-(canvas.clientLeft||0);
 const y=event.clientY-box.top-(canvas.clientTop||0);
 return {x:x*canvas.width/width,y:y*canvas.height/height};
}
