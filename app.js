'use strict';
const config=window.DOMFAR_CONFIG;
const $=s=>document.querySelector(s);
let previousFocus;
function showDialog(dialog){previousFocus=document.activeElement;dialog.showModal();document.body.style.overflow='hidden';}
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus();});
});
const carousel = $('#night-road');
if (carousel) {
 const track = carousel.querySelector('.photo-carousel-track');
 const controls = carousel.querySelector('.photo-carousel-controls');
 const [previous, next] = controls.querySelectorAll('button');

 function updateCarouselControls() {
  previous.disabled = track.scrollLeft <= 1;
  next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
 }

 controls.hidden = false;
 controls.addEventListener('click', event => {
  const button = event.target.closest('[data-carousel-step]');
  if (!button) return;
  const [first, second] = track.children;
  track.scrollBy({
   left: (second.offsetLeft - first.offsetLeft) * Number(button.dataset.carouselStep),
   behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  });
 });
 track.addEventListener('scroll', updateCarouselControls, { passive: true });
 window.addEventListener('resize', updateCarouselControls);
 updateCarouselControls();
}
const galleryPhotos=[...document.querySelectorAll('[data-image]')];
let photoIndex=0;
function displayPhoto(index){
 photoIndex=(index+galleryPhotos.length)%galleryPhotos.length;
 const button=galleryPhotos[photoIndex];
 $('#lightbox-image').src=button.dataset.image;
 $('#lightbox-image').alt=button.dataset.caption;
 $('#lightbox-caption').textContent=button.dataset.caption;
 $('#photo-counter').textContent=(photoIndex+1)+' / '+galleryPhotos.length;
}
galleryPhotos.forEach((button,index)=>button.addEventListener('click',()=>{displayPhoto(index);showDialog($('#lightbox'));}));
$('#photo-prev').addEventListener('click',()=>displayPhoto(photoIndex-1));
$('#photo-next').addEventListener('click',()=>displayPhoto(photoIndex+1));
$('#lightbox').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();displayPhoto(photoIndex+(event.key==='ArrowRight'?1:-1));}});
document.querySelectorAll('[data-car]').forEach(button=>button.addEventListener('click',()=>{$('#car').value=button.dataset.car;$('#select').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('#car').focus({preventScroll:true});}));
function orderMessage(){return 'Здравствуйте! Хочу узнать стоимость оптики DomFar3D.\nЗадача: '+$('#service').value+'\nАвтомобиль: '+$('#car').value+'\n'+$('#details').value.trim()+'\nПодскажите совместимость, комплектацию, наличие и стоимость.';}
function openWhatsApp(text){window.open('https://wa.me/'+config.phone+'?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');}
$('#selection-form').addEventListener('submit',e=>{e.preventDefault();openWhatsApp(orderMessage());$('#selection-status').textContent='Продолжите в WhatsApp и отправьте сообщение. Заявка с сайта автоматически не отправляется.';});
$('#selection-telegram').addEventListener('click',()=>{window.open(config.telegram+'?text='+encodeURIComponent(orderMessage()),'_blank','noopener,noreferrer');$('#selection-status').textContent='Продолжите в Telegram и отправьте сообщение. Если чат по номеру недоступен, позвоните нам.';});
document.querySelectorAll('.callback-open').forEach(button=>button.addEventListener('click',()=>showDialog($('#callback-dialog'))));
$('#callback-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#callback-phone');const digits=input.value.replace(/\D/g,'');if(digits.length<10||digits.length>15){input.setCustomValidity('Укажите телефон: от 10 до 15 цифр.');input.reportValidity();return;}input.setCustomValidity('');const time=$('#callback-time').value.trim()||'согласуем в переписке';openWhatsApp('Здравствуйте! Прошу перезвонить по поводу фар DomFar3D.\nМой телефон: '+input.value.trim()+'\nУдобное время по Москве: '+time);$('#callback-status').textContent='Отправьте подготовленное сообщение в WhatsApp — только после этого мастер получит просьбу о звонке.';});
$('#callback-phone').addEventListener('input',e=>e.target.setCustomValidity(''));
document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();})));
$('#year').textContent=new Date().getFullYear();

document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{$('#service').value=link.dataset.service;$('#service').focus({preventScroll:true});}));

