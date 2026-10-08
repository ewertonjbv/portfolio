/* Mobile portfolio navigation: accessibility, language sync and active section */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const toggle = document.getElementById('mobile-menu-btn');
        const panel = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        const closeButton = document.getElementById('mobile-menu-close');
        if (!toggle || !panel || !backdrop || !closeButton) return;

        const links = Array.from(panel.querySelectorAll('a[href^="#"]'));
        const navLinks = Array.from(panel.querySelectorAll('.mobile-menu-link'));
        const sections = Array.from(document.querySelectorAll('main section[id]'));

        function selectedLanguage() {
            const value = localStorage.getItem('portfolioLang') || 'pt';
            return (typeof translations !== 'undefined' && translations[value]) ? value : 'pt';
        }

        function syncLabels() {
            const lang = selectedLanguage();
            const tr = translations[lang];
            toggle.setAttribute('aria-label', tr[panel.hidden ? 'mobile_menu_open' : 'mobile_menu_close']);
            closeButton.setAttribute('aria-label', tr.mobile_menu_close);
            panel.setAttribute('aria-label', tr.mobile_menu_title);
        }
        window.syncMobileMenuLanguage = syncLabels;

        function setOpen(isOpen, returnFocus) {
            panel.hidden = !isOpen;
            backdrop.hidden = !isOpen;
            document.body.classList.toggle('mobile-menu-open', isOpen);
            toggle.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            syncLabels();
            if (isOpen) closeButton.focus({ preventScroll: true });
            else if (returnFocus) toggle.focus({ preventScroll: true });
        }

        toggle.addEventListener('click', () => setOpen(panel.hidden, false));
        closeButton.addEventListener('click', () => setOpen(false, true));
        backdrop.addEventListener('click', () => setOpen(false, false));
        links.forEach(link => link.addEventListener('click', () => setOpen(false, false)));

        document.addEventListener('keydown', event => {
            if (panel.hidden) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false, true);
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = [closeButton, ...links];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        function syncActiveSection() {
            let current = sections.length ? sections[0].id : '';
            for (const section of sections) {
                if (section.getBoundingClientRect().top <= 155) current = section.id;
            }
            for (const link of navLinks) {
                const active = link.getAttribute('href') === '#' + current;
                link.classList.toggle('is-current', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            }
        }
        window.addEventListener('scroll', syncActiveSection, { passive: true });
        window.addEventListener('hashchange', syncActiveSection);
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && !panel.hidden) setOpen(false, false);
            syncActiveSection();
        });
        syncLabels();
        syncActiveSection();
    });
})();
