
const dock=document.getElementById('dock'),light=document.getElementById('dockLight'),msg=document.querySelector('.state-note');
function choose(btn){dock.querySelectorAll('.dock-btn').forEach(b=>b.classList.toggle('active',b===btn));const dr=dock.getBoundingClientRect(),br=btn.getBoundingClientRect();light.style.transform=`translateX(${br.left-dr.left-(parseFloat(getComputedStyle(dock).paddingLeft))}px)`;msg.textContent=btn.dataset.name+' selecionado';}
dock.querySelectorAll('.dock-btn').forEach(b=>b.addEventListener('click',()=>choose(b)));window.addEventListener('resize',()=>{const active=dock.querySelector('.dock-btn.active');if(active)choose(active)});
