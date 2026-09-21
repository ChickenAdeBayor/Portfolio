// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Nav background on scroll ----------
var nav = document.getElementById('nav');
window.addEventListener('scroll', function(){
  if (window.scrollY > 40) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// ---------- Scroll reveal ----------
var revealEls = document.querySelectorAll('.reveal');
var revealObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if (entry.isIntersecting){
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(function(el){ revealObserver.observe(el); });
