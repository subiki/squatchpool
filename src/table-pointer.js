/** Convert pointer events to canvas coordinates, including CSS scaling and borders. */
export function tablePoint(canvas,event){
 const box=canvas.getBoundingClientRect();
 return {x:(event.clientX-box.left-canvas.clientLeft)*canvas.width/canvas.clientWidth,
         y:(event.clientY-box.top-canvas.clientTop)*canvas.height/canvas.clientHeight};
}
