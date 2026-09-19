// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Theme (dark mode) ----------
// The <head> script already set data-theme before paint if a choice
// was stored, so this only needs to wire up the toggle and keep the
// icon (and the 3D background's baked-in colors) in sync with it.
(function(){
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme(){
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function effectiveTheme(){
    var stored = storedTheme();
    return (stored === 'dark' || stored === 'light') ? stored : (media.matches ? 'dark' : 'light');
  }

  function reflect(theme){
    toggle.classList.toggle('is-dark', theme === 'dark');
    toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (window.__setBackgroundTheme) window.__setBackgroundTheme(theme);
  }

  window.__initialBgTheme = effectiveTheme();
  reflect(window.__initialBgTheme);

  toggle.addEventListener('click', function(){
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch (e) {}
    root.setAttribute('data-theme', next);
    reflect(next);
  });

  // If the visitor hasn't chosen explicitly, keep following the OS.
  media.addEventListener('change', function(){
    if (!storedTheme()) reflect(effectiveTheme());
  });
})();

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
