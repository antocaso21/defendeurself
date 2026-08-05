(() => {
  const menuButton = document.querySelector('.mobile-menu-button');
  const nav = document.querySelector('.site-nav');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 })
    : null;

  document.querySelectorAll('.reveal').forEach(el => {
    if (observer) observer.observe(el);
    else el.classList.add('visible');
  });

  document.querySelectorAll('[data-counter]').forEach(counter => {
    const target = Number(counter.dataset.counter || 0);
    let animated = false;
    const run = () => {
      if (animated) return;
      animated = true;
      const start = performance.now();
      const duration = 1000;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * eased).toLocaleString('en-GB');
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          run();
          counterObserver.disconnect();
        }
      }, { threshold: 0.5 });
      counterObserver.observe(counter);
    } else run();
  });

  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      const email = form.querySelector('input[type="email"]');
      if (email && !email.validity.valid) {
        if (status) status.textContent = 'Please enter a valid email address.';
        email.focus();
        return;
      }
      if (status) status.textContent = form.dataset.success || 'Thank you. Your message has been recorded in this demo.';
      form.reset();
    });
  });

  document.querySelectorAll('[data-coming-soon]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const original = link.textContent;
      link.textContent = 'File to be added';
      setTimeout(() => { link.textContent = original; }, 1800);
    });
  });

  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
