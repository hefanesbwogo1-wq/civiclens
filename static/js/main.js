document.addEventListener('DOMContentLoaded', () => {
  // Header scroll
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if(window.scrollY > 20) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');
  });

  // Mobile nav creation
  if(!document.querySelector('.mobile-nav')){
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav';
    mobileNav.innerHTML = `
      <div class="mobile-nav-header">
        <img src="/static/images/civiclens-logo.png" alt="CivicLens">
        <button class="mobile-nav-close">✕</button>
      </div>
      <div class="mobile-nav-links">
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        <a href="#pricing">Pricing</a>
        <a href="#about">About</a>
      </div>
      <div class="mobile-nav-actions">
        <a href="/login" class="btn btn-outline">Sign In</a>
        <a href="/register" class="btn btn-primary">Create Account</a>
      </div>
    `;
    document.body.appendChild(mobileNav);
    const openBtn = document.querySelector('.mobile-menu-btn');
    const closeBtn = mobileNav.querySelector('.mobile-nav-close');
    openBtn?.addEventListener('click', () => mobileNav.classList.add('open'));
    closeBtn?.addEventListener('click', () => mobileNav.classList.remove('open'));
    mobileNav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> mobileNav.classList.remove('open')));
  }
});