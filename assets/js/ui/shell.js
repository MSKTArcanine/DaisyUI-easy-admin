import { lockScroll, unlockScroll } from './scroll-lock.js';

const KEY = Symbol.for('easyadmin.shell');
const MOBILE_CLASS = 'ea-mobile-sidebar-visible';
const focusable = (root) =>
    [...root.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[contenteditable="true"]')].filter(
        (element) =>
            element.tabIndex >= 0 &&
            !element.matches(':disabled,[disabled],[aria-disabled="true"]') &&
            !element.closest('[inert]') &&
            getComputedStyle(element).visibility === 'visible' &&
            element.getClientRects().length > 0
    );

function updateLayoutToggle(toggle) {
    const sidebar = toggle.matches('.ea-layout-toggle-sidebar');
    const expanded = sidebar
        ? !document.body.classList.contains('ea-sidebar-width-compact')
        : document.body.classList.contains('ea-content-width-full');
    const label = expanded ? toggle.dataset.eaCollapseLabel : toggle.dataset.eaExpandLabel;
    toggle.setAttribute('aria-expanded', String(expanded));
    if (label) {
        toggle.setAttribute('aria-label', label);
        const text = toggle.querySelector('.ea-layout-toggle-label');
        if (text) {
            text.textContent = label;
        }
    }
}

export function initShell(root = document) {
    const document = root.ownerDocument ?? root;
    let state = document[KEY];
    if (!state) {
        state = document[KEY] = {
            desktop: document.defaultView.matchMedia('(min-width: 992px)'),
            open: false,
            inert: new Map(),
            sequence: 0,
        };
        bind(document, state);
    }
    for (const toggle of document.querySelectorAll('.ea-layout-toggle-sidebar,.ea-layout-toggle-content')) {
        updateLayoutToggle(toggle);
    }
    for (const item of document.querySelectorAll('.ea-sidebar-item.has-submenu')) {
        const toggle = item.querySelector(':scope > .ea-sidebar-item-link');
        const submenu = item.querySelector(':scope > .ea-sidebar-submenu');
        if (toggle && submenu && !toggle.hasAttribute('aria-controls')) {
            submenu.id ||= `ea-sidebar-submenu-${++state.sequence}`;
            toggle.setAttribute('aria-controls', submenu.id);
        }
    }
    const sidebar = document.querySelector('[data-ea-sidebar],.sidebar-wrapper');
    const toggle = document.querySelector('#navigation-toggler');
    if (sidebar && toggle && sidebar !== state.sidebar) {
        state.sidebar = sidebar;
        state.panel = sidebar.matches('.ea-sidebar') ? sidebar : (sidebar.querySelector('.ea-sidebar') ?? sidebar);
        if (!state.panel.hasAttribute('tabindex')) {
            state.panel.tabIndex = -1;
        }
        state.toggle = toggle;
        state.sidebarInert = sidebar.inert;
        state.sidebarHidden = sidebar.getAttribute('aria-hidden');
        sidebar.id ||= 'ea-navigation';
        if (!toggle.hasAttribute('aria-controls')) {
            toggle.setAttribute('aria-controls', sidebar.id);
        }
    }
    updateSidebarAvailability(state);
}

function updateSidebarAvailability(state) {
    if (!state.sidebar) {
        return;
    }
    const hidden = !state.desktop.matches && !state.open;
    state.sidebar.inert = hidden || state.sidebarInert;
    if (hidden) {
        state.sidebar.setAttribute('aria-hidden', 'true');
    } else if (state.sidebarHidden === null) {
        state.sidebar.removeAttribute('aria-hidden');
    } else {
        state.sidebar.setAttribute('aria-hidden', state.sidebarHidden);
    }
}

function setBackgroundInert(document, state) {
    const visit = (parent) => {
        for (const element of parent.children) {
            if (element === state.sidebar || element === state.toggle || element === state.backdrop) {
                continue;
            }
            if (element.contains(state.sidebar) || element.contains(state.toggle)) {
                visit(element);
            } else if (!element.matches('script,style,link,meta,template,dialog')) {
                state.inert.set(element, element.inert);
                element.inert = true;
            }
        }
    };
    visit(document.body);
}

function openSidebar(document, state) {
    if (state.open || state.desktop.matches || !state.sidebar || !state.toggle) {
        return;
    }
    state.open = true;
    lockScroll(document, state, true);
    document.body.classList.add(MOBILE_CLASS);
    state.toggle.setAttribute('aria-expanded', 'true');
    state.backdrop = document.createElement('div');
    state.backdrop.className = 'ea-sidebar-backdrop';
    state.backdrop.setAttribute('data-ea-sidebar-backdrop', '');
    state.backdrop.setAttribute('aria-hidden', 'true');
    document.body.append(state.backdrop);
    setBackgroundInert(document, state);
    state.inert.set(state.toggle, state.toggle.inert);
    state.toggle.inert = true;
    updateSidebarAvailability(state);
    state.backdrop.getBoundingClientRect();
    state.backdrop.classList.add('show');
    const controls = focusable(state.sidebar);
    const current = controls.find((element) => element.matches('[aria-current="page"]'));
    (current ?? controls[0] ?? state.panel).focus({ preventScroll: true });
    state.sidebar.dispatchEvent(new CustomEvent('ea.sidebar.shown', { bubbles: true }));
}

function closeSidebar(document, state, restoreFocus = true) {
    if (!state.open) {
        return;
    }
    state.open = false;
    document.body.classList.remove(MOBILE_CLASS);
    state.toggle.setAttribute('aria-expanded', 'false');
    unlockScroll(document, state);
    for (const [element, inert] of state.inert) {
        element.inert = inert;
    }
    state.inert.clear();
    const backdrop = state.backdrop;
    state.backdrop = null;
    backdrop?.classList.remove('show');
    if (backdrop) {
        Promise.allSettled(backdrop.getAnimations().map((animation) => animation.finished)).then(() =>
            backdrop.remove()
        );
    }
    updateSidebarAvailability(state);
    if (restoreFocus && !state.desktop.matches) {
        state.toggle.focus({ preventScroll: true });
    }
    state.sidebar.dispatchEvent(new CustomEvent('ea.sidebar.hidden', { bubbles: true }));
}

function bind(document, state) {
    document.addEventListener('click', (event) => {
        const navigationToggle = event.target.closest('#navigation-toggler');
        if (navigationToggle) {
            state.open ? closeSidebar(document, state) : openSidebar(document, state);
            return;
        }
        if (event.target.closest('[data-ea-sidebar-backdrop]')) {
            closeSidebar(document, state);
            return;
        }
        const layoutToggle = event.target.closest('.ea-layout-toggle-sidebar,.ea-layout-toggle-content');
        if (layoutToggle) {
            const part = layoutToggle.matches('.ea-layout-toggle-sidebar') ? 'sidebar' : 'content';
            const alternative = part === 'sidebar' ? 'compact' : 'full';
            const expanded = document.body.classList.contains(`ea-${part}-width-${alternative}`);
            const width = expanded ? 'normal' : alternative;
            document.body.classList.add(`ea-${part}-transitions`);
            document.body.classList.toggle(`ea-${part}-width-${alternative}`, !expanded);
            document.body.classList.toggle(`ea-${part}-width-normal`, expanded);
            if (document.body.getAttribute(`data-ea-${part}-width-configured`) !== 'true') {
                localStorage.setItem(`ea/${part}/width`, width);
            }
            for (const toggle of document.querySelectorAll(`.ea-layout-toggle-${part}`)) {
                updateLayoutToggle(toggle);
            }
            return;
        }
        const submenuToggle = event.target.closest('.ea-sidebar-item-link');
        const item = submenuToggle?.parentElement;
        if (item?.matches('.ea-sidebar-item.has-submenu:not(.is-kept-open)')) {
            const expanded = !item.classList.contains('is-expanded');
            const scope = item.closest('.ea-sidebar-content') ?? item.parentElement;
            for (const other of scope.querySelectorAll('.ea-sidebar-item.has-submenu.is-expanded:not(.is-kept-open)')) {
                if (!other.contains(item)) {
                    other.classList.remove('is-expanded');
                    other.querySelector(':scope > .ea-sidebar-item-link')?.setAttribute('aria-expanded', 'false');
                }
            }
            item.classList.toggle('is-expanded', expanded);
            submenuToggle.setAttribute('aria-expanded', String(expanded));
        } else if (
            state.open &&
            !event.defaultPrevented &&
            state.sidebar.contains(event.target) &&
            event.target.closest('a[href]')
        ) {
            closeSidebar(document, state, false);
        }
    });
    document.addEventListener('keydown', (event) => {
        if (!state.open || event.defaultPrevented) {
            return;
        }
        if (event.key === 'Escape') {
            if (document.querySelector('dialog[open],.dropdown-menu.show,.modal.show')) {
                return;
            }
            event.preventDefault();
            closeSidebar(document, state);
        } else if (event.key === 'Tab') {
            if (document.querySelector('dialog[open],.modal.show')) {
                return;
            }
            const controls = focusable(state.sidebar);
            const first = controls[0] ?? state.panel;
            const last = controls.at(-1) ?? state.panel;
            if ((event.shiftKey && event.target === first) || (!event.shiftKey && event.target === last)) {
                (event.shiftKey ? last : first).focus();
                event.preventDefault();
            }
        }
    });
    document.addEventListener('focusin', (event) => {
        if (
            state.open &&
            !document.querySelector('dialog[open],.modal.show') &&
            !state.sidebar.contains(event.target)
        ) {
            (focusable(state.sidebar)[0] ?? state.panel).focus({ preventScroll: true });
        }
    });
    state.desktop.addEventListener('change', () => {
        if (state.desktop.matches) {
            closeSidebar(document, state, false);
        }
        updateSidebarAvailability(state);
    });
    document.addEventListener('ea.collection.item-added', () => initShell(document));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initShell());
} else {
    initShell();
}
