/* Announce shot rulings above the table without hiding gameplay controls. */
const stage=document.getElementById('table-stage');
if(stage){
 const banner=document.createElement('div');banner.className='shot-announcer';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');stage.appendChild(banner);
 let hideTimer;
 window.squatchAnnounceShot=(message)=>{
  if(!message)return;
  clearTimeout(hideTimer);banner.classList.remove('is-visible');banner.textContent=String(message);
  void banner.offsetWidth;banner.classList.add('is-visible');
  hideTimer=setTimeout(()=>banner.classList.remove('is-visible'),3400);
 };
}
