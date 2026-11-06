//HERO SECTION SLIDER
const swiper = new Swiper('.hero-slider', {
    loop: true,
    speed: 1200,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  });
  
  const panel = document.getElementById('sidePanel');
  const overlay = document.getElementById('overlay');
  
  document.getElementById('menuBtn').onclick = () => {
    panel.classList.add('active');
    overlay.classList.add('active');
  };
  
  document.getElementById('closePanel').onclick = closePanel;
  overlay.onclick = closePanel;
  
  function closePanel(){
    panel.classList.remove('active');
    overlay.classList.remove('active');
  }
  