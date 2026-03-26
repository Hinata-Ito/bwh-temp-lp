/* BWH総合研究所 - 内部ページ共通JS */

// ---- Hamburger Dropdown ----
const hamburger = document.getElementById('hamburger');
const dropdownNav = document.getElementById('dropdown-nav');

if (hamburger && dropdownNav) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburger.classList.toggle('active');
    dropdownNav.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !dropdownNav.contains(e.target)) {
      hamburger.classList.remove('active');
      dropdownNav.classList.remove('open');
    }
  });
}

function closeDropdown() {
  if (hamburger) hamburger.classList.remove('active');
  if (dropdownNav) dropdownNav.classList.remove('open');
}

// ---- Fade Up ----
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
fadeEls.forEach(el => observer.observe(el));

// ---- Filter buttons ----
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
