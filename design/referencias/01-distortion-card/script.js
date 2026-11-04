
const glass = document.getElementById('heroGlass');
glass.addEventListener('pointermove',(e)=>{const r=glass.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;glass.style.setProperty('--tilt-y',((x-.5)*11).toFixed(2)+'deg');glass.style.setProperty('--tilt-x',((.5-y)*9).toFixed(2)+'deg');glass.style.setProperty('--mx',(x*100).toFixed(1)+'%');glass.style.setProperty('--my',(y*100).toFixed(1)+'%')});
glass.addEventListener('pointerleave',()=>{glass.style.setProperty('--tilt-y','0deg');glass.style.setProperty('--tilt-x','0deg')});
