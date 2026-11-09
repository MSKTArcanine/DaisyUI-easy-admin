import { lockScroll, unlockScroll } from './scroll-lock.js';

const KEY = Symbol.for('easyadmin.ui');
const MENU = '[data-ea-toggle="dropdown"]';
const TAB = '[data-ea-toggle="tab"][id^="tablist-"]';
const all = (root, selector) => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
const targetOf = (element) => {
    const selector =
        element.getAttribute('data-ea-target') ??
        element.getAttribute('data-bs-target') ??
        element.getAttribute('href');
    if (!selector || selector === '#') {
        return null;
    }
    if (selector.startsWith('#')) {
        const target = element.ownerDocument.getElementById(selector.slice(1));
        if (target) {
            return target;
        }
    }
    try {
        return element.ownerDocument.querySelector(selector);
    } catch (error) {
        if (error.name === 'SyntaxError') {
            return null;
        }
        throw error;
    }
};
const menuFor = (toggle) =>
    targetOf(toggle)?.matches('[data-ea-menu]')
        ? targetOf(toggle)
        : toggle.parentElement?.querySelector(
              ':scope > [data-ea-menu], :scope > [data-ea-menu-overlay] > [data-ea-menu]'
          );
const emit = (element, name, detail = {}, cancelable = false) =>
    element.dispatchEvent(new CustomEvent(name, { detail, cancelable, bubbles: true }));
function stateFor(document) {
    if (!document[KEY]) {
        document[KEY] = {
            menus: new Map(),
            dialogs: new Map(),
            initialized: new WeakSet(),
            urls: new WeakMap(),
            sequence: 0,
        };
    }

    return document[KEY];
}

export function initEasyAdminUI(root = document) {
    const document = root.ownerDocument ?? root;
    const state = stateFor(document);
    for (const element of all(root, '[data-bs-toggle], [data-bs-dismiss]')) {
        const type = element.getAttribute('data-bs-toggle');
        if (
            !(
                (type === 'modal' && targetOf(element)?.matches('dialog[data-ea-dialog]')) ||
                (type === 'dropdown' && menuFor(element)) ||
                (element.getAttribute('data-bs-dismiss') === 'modal' && element.closest('dialog[data-ea-dialog]'))
            )
        ) {
            continue;
        }
        for (const name of element.getAttributeNames().filter((name) => name.startsWith('data-bs-'))) {
            const replacement = name.replace('data-bs-', 'data-ea-');
            if (!element.hasAttribute(replacement)) {
                element.setAttribute(replacement, element.getAttribute(name));
            }
            element.removeAttribute(name);
        }
    }
    for (const menu of all(root, '[data-ea-menu]')) {
        if (!state.initialized.has(menu)) {
            state.initialized.add(menu);
            menu.id ||= `ea-menu-${++state.sequence}`;
            menu.hidden = true;
            if (!menu.hasAttribute('role')) {
                menu.setAttribute('role', 'menu');
            }
        }
        for (const item of menu.querySelectorAll('[data-ea-menu-item]')) {
            if (!item.hasAttribute('role')) {
                const group = item.closest('[data-ea-menu-group]');
                item.setAttribute('role', group ? `menuitem${group.dataset.eaMenuGroup}` : 'menuitem');
            }
        }
    }
    for (const toggle of all(root, MENU)) {
        const menu = menuFor(toggle);
        if (menu && !toggle.hasAttribute('aria-controls')) {
            toggle.setAttribute('aria-controls', menu.id);
        }
    }
    for (const toggle of all(root, '[data-ea-toggle="collapse"]')) {
        const panel = targetOf(toggle);
        if (!panel) {
            continue;
        }
        const native = panel.hasAttribute('data-ea-collapse');
        panel.setAttribute('data-ea-collapse', '');
        if (!state.initialized.has(panel)) {
            state.initialized.add(panel);
            panel.hidden = native || panel.hasAttribute('hidden') ? panel.hidden : !panel.classList.contains('show');
            panel.classList.toggle('show', !panel.hidden);
        }
        toggle.setAttribute('aria-expanded', String(!panel.hidden));
        toggle.classList.toggle('collapsed', panel.hidden);
        if (panel.id && !toggle.hasAttribute('aria-controls')) {
            toggle.setAttribute('aria-controls', panel.id);
        }
    }
    for (const dialog of all(root, 'dialog[data-ea-dialog]')) {
        if (state.initialized.has(dialog)) {
            continue;
        }
        state.initialized.add(dialog);
        if (!dialog.hasAttribute('aria-label') && !dialog.hasAttribute('aria-labelledby')) {
            const heading = dialog.querySelector('h1,h2,h3,h4,h5,h6');
            if (heading) {
                heading.id ||= `ea-dialog-title-${++state.sequence}`;
                dialog.setAttribute('aria-labelledby', heading.id);
            }
        }
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            if (dialog.dataset.eaKeyboard !== 'false') {
                closeDialog(dialog, 'cancel');
            }
        });
        dialog.addEventListener('close', () => {
            const entry = state.dialogs.get(dialog);
            state.dialogs.delete(dialog);
            dialog.classList.remove('show');
            unlockScroll(document, dialog);
            if (entry?.trigger?.isConnected) {
                entry.trigger.focus({ preventScroll: true });
            }
            emit(dialog, 'ea.modal.hidden', { trigger: entry?.trigger, reason: entry?.reason ?? dialog.returnValue });
        });
    }
    for (const list of all(root, '[data-ea-tab-list]')) {
        for (const tab of list.querySelectorAll(TAB)) {
            const pane = targetOf(tab);
            if (pane) {
                if (!pane.hasAttribute('role')) {
                    pane.setAttribute('role', 'tabpanel');
                }
                if (!pane.hasAttribute('aria-labelledby')) {
                    pane.setAttribute('aria-labelledby', tab.id);
                }
                pane.setAttribute('data-ea-tab-panel', '');
                pane.parentElement.setAttribute('data-ea-tab-panels', '');
                pane.hidden = tab.getAttribute('aria-selected') !== 'true';
            }
        }
    }
    if (!state.bound) {
        state.bound = true;
        bind(document, state);
    }
    initTabs(document);
}

export function showDialog(dialog, trigger = null) {
    if (!dialog || dialog.open || !emit(dialog, 'ea.modal.show', { trigger }, true)) {
        return;
    }
    const document = dialog.ownerDocument;
    const state = stateFor(document);
    lockScroll(document, dialog);
    state.dialogs.set(dialog, { trigger: trigger ?? document.activeElement, reason: 'close' });
    dialog.returnValue = '';
    dialog.showModal();
    dialog.classList.add('show');
    emit(dialog, 'ea.modal.shown', { trigger });
}

export function closeDialog(dialog, reason = 'close') {
    if (!dialog?.open || !emit(dialog, 'ea.modal.hide', { reason }, true)) {
        return;
    }
    const entry = stateFor(dialog.ownerDocument).dialogs.get(dialog);
    if (entry) {
        entry.reason = reason;
    }
    dialog.close(reason);
}

export function setCollapse(panel, expanded) {
    if (!panel || panel.hidden === !expanded) {
        return;
    }
    const phase = expanded ? 'show' : 'hide';
    if (!emit(panel, `ea.collapse.${phase}`, {}, true)) {
        return;
    }
    panel.hidden = !expanded;
    panel.classList.toggle('show', expanded);
    for (const toggle of panel.ownerDocument.querySelectorAll('[data-ea-toggle="collapse"]')) {
        if (targetOf(toggle) === panel) {
            toggle.setAttribute('aria-expanded', String(expanded));
            toggle.classList.toggle('collapsed', !expanded);
        }
    }
    emit(panel, `ea.collapse.${expanded ? 'shown' : 'hidden'}`);
}

function items(menu) {
    return [...menu.querySelectorAll('[data-ea-menu-item]')].filter(
        (item) =>
            item.closest('[data-ea-menu]') === menu &&
            !item.matches(':disabled,[disabled],[aria-disabled="true"],.disabled,.btn-disabled,[data-ea-menu-split]') &&
            item.getClientRects().length > 0
    );
}

function position(menu, toggle) {
    const viewport = toggle.ownerDocument.documentElement;
    const anchor = (toggle.dataset.eaReference === 'parent' ? toggle.parentElement : toggle).getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    const rtl = getComputedStyle(toggle).direction === 'rtl';
    const nested = toggle.closest('[data-ea-menu]');
    const offsets = (toggle.dataset.eaOffset ?? '0,5').split(',').map(Number);
    const distance = Number.isFinite(offsets[1]) ? offsets[1] : 5;
    let left = (rtl !== (menu.dataset.eaAlign === 'end') ? anchor.right - box.width : anchor.left) + (offsets[0] || 0);
    let top = anchor.bottom + distance;
    if (nested) {
        left = rtl ? anchor.left - box.width - distance : anchor.right + distance;
        if (left < 8 || left + box.width > viewport.clientWidth - 8) {
            left = rtl ? anchor.right + distance : anchor.left - box.width - distance;
        }
        top = anchor.top;
    } else if (top + box.height > viewport.clientHeight - 8 && anchor.top > box.height + distance) {
        top = anchor.top - box.height - distance;
    }
    menu.style.left = `${Math.max(8, Math.min(left, viewport.clientWidth - box.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(top, viewport.clientHeight - box.height - 8))}px`;
    menu.style.maxBlockSize = `${viewport.clientHeight - 16}px`;
}

export function showMenu(toggle, focus = null) {
    const menu = menuFor(toggle);
    if (!menu || toggle.matches(':disabled,[disabled],[aria-disabled="true"],.disabled,.btn-disabled')) {
        return;
    }
    const state = stateFor(toggle.ownerDocument);
    for (const [other] of state.menus) {
        if (other !== menu && !other.contains(toggle)) {
            hideMenu(other);
        }
    }
    menu.hidden = false;
    menu.classList.add('show');
    menu.style.position = 'fixed';
    menu.style.inset = 'auto';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('show');
    state.menus.set(menu, toggle);
    position(menu, toggle);
    if (focus) {
        const options = items(menu);
        (focus === 'last' ? options.at(-1) : options[0])?.focus();
    }
    emit(toggle, 'ea.menu.shown', { menu });
}

export function hideMenu(menu, restoreFocus = false) {
    const state = stateFor(menu.ownerDocument);
    clearTimeout(state.hoverTimer);
    const toggle = state.menus.get(menu);
    for (const [child] of state.menus) {
        if (child !== menu && menu.contains(child)) {
            hideMenu(child);
        }
    }
    menu.hidden = true;
    menu.classList.remove('show');
    toggle?.classList.remove('show');
    toggle?.setAttribute('aria-expanded', 'false');
    state.menus.delete(menu);
    if (restoreFocus) {
        toggle?.focus();
    }
    if (toggle) {
        emit(toggle, 'ea.menu.hidden', { menu });
    }
}

export function activateTab(tab) {
    const list = tab?.closest('[data-ea-tab-list]');
    if (!list || tab.matches('[aria-disabled="true"],[disabled]')) {
        return;
    }
    const tabs = [...list.querySelectorAll(TAB)].filter((item) => item.closest('[data-ea-tab-list]') === list);
    const previous = tabs.find((item) => item.getAttribute('aria-selected') === 'true');
    if (previous === tab || !emit(tab, 'ea.tab.show', { previous }, true)) {
        return;
    }
    for (const item of tabs) {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        item.classList.toggle('active', active);
        item.classList.toggle('tab-active', active);
        const pane = targetOf(item);
        if (pane) {
            pane.hidden = !active;
            pane.classList.toggle('active', active);
        }
    }
    emit(tab, 'ea.tab.shown', { previous, pane: targetOf(tab) });
}

export function setTabAsActive(tabItemId) {
    activateTab(document.getElementById(tabItemId));
}

export function initTabs(document = window.document) {
    if (!document.querySelector(TAB)) {
        return;
    }
    const state = stateFor(document);
    const updateLinks = () => {
        const selected = document.querySelector(`${TAB}[aria-selected="true"]`);
        for (const link of document.querySelectorAll(
            'a[data-action-name="edit"][href]:not([data-ea-action-form-id]),a[data-action-name="detail"][href]:not([data-ea-action-form-id])'
        )) {
            if (!state.urls.has(link)) {
                state.urls.set(link, link.getAttribute('href').split('#')[0]);
            }
            link.setAttribute('href', `${state.urls.get(link)}${selected?.getAttribute('href') ?? ''}`);
        }
    };
    if (!state.historyBound) {
        state.historyBound = true;
        const restore = (selectFirst = true) => {
            state.restoring = true;
            const hash = document.defaultView.location.hash.slice(1);
            activateTab(
                hash ? document.getElementById(`tablist-${hash}`) : selectFirst ? document.querySelector(TAB) : null
            );
            state.restoring = false;
            updateLinks();
        };
        document.addEventListener('ea.tab.shown', (event) => {
            if (event.target.matches(TAB)) {
                const hash = event.target.getAttribute('href');
                if (!state.restoring && document.defaultView.location.hash !== hash) {
                    document.defaultView.history.pushState({}, '', hash);
                }
                updateLinks();
            }
        });
        document.defaultView.addEventListener('popstate', () => restore());
        restore(false);
    }
    updateLinks();
}

function bind(document, state) {
    document.addEventListener(
        'click',
        (event) => {
            const item = event.target.closest('[data-ea-menu-item],[data-ea-toggle]');
            if (item?.matches(':disabled,[disabled],[aria-disabled="true"],.disabled,.btn-disabled')) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        },
        true
    );
    document.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-ea-toggle]');
        if (toggle?.dataset.eaToggle === 'modal' && targetOf(toggle)?.matches('dialog[data-ea-dialog]')) {
            event.preventDefault();
            showDialog(targetOf(toggle), toggle);
        } else if (toggle?.dataset.eaToggle === 'dropdown') {
            event.preventDefault();
            const menu = menuFor(toggle);
            if (state.pointerToggle === toggle && event.detail !== 0) {
                state.pointerToggle = null;
            } else if (menu && state.menus.has(menu)) {
                hideMenu(menu);
            } else {
                showMenu(toggle, event.detail === 0 ? 'first' : null);
            }
        } else if (toggle?.dataset.eaToggle === 'tab') {
            event.preventDefault();
            activateTab(toggle);
        } else if (toggle?.dataset.eaToggle === 'collapse') {
            event.preventDefault();
            const panel = targetOf(toggle);
            if (panel) {
                setCollapse(panel, panel.hidden);
            }
        }
        const dismiss = event.target.closest('[data-ea-dismiss]');
        if (dismiss?.dataset.eaDismiss === 'modal') {
            const wasPrevented = event.defaultPrevented;
            if (dismiss.matches('a')) {
                event.preventDefault();
            }
            const submitsForm = dismiss.form && ['submit', 'image'].includes(dismiss.type);
            if (!submitsForm && !wasPrevented) {
                closeDialog(dismiss.closest('dialog[data-ea-dialog]'), dismiss.dataset.eaDialogResult ?? 'close');
            }
        } else if (dismiss?.dataset.eaDismiss === 'alert') {
            event.preventDefault();
            dismiss.closest('[data-ea-alert]')?.remove();
        }
        if (
            event.target === state.backdrop &&
            event.target.matches('dialog[data-ea-dialog]') &&
            !['false', 'static'].includes(event.target.dataset.eaBackdrop)
        ) {
            closeDialog(event.target, 'cancel');
        }
        const item = event.target.closest('[data-ea-menu-item]');
        for (const [menu, button] of state.menus) {
            const inside = menu.contains(event.target) || button.contains(event.target);
            const mode = button.dataset.eaAutoClose ?? 'true';
            const staysOpen = mode === 'outside' || mode === 'false' || item?.closest('[data-ea-menu-group]');
            if (
                (!inside && mode !== 'false' && mode !== 'inside') ||
                (item && menu.contains(item) && !toggle && !staysOpen)
            ) {
                hideMenu(menu);
            }
        }
    });
    document.addEventListener('pointerdown', (event) => {
        state.backdrop = event.target.matches('dialog[data-ea-dialog]') ? event.target : null;
        const toggle = event.target.closest(MENU);
        if (
            event.pointerType !== 'mouse' ||
            event.button !== 0 ||
            event.ctrlKey ||
            !toggle ||
            toggle.closest('[data-ea-menu]')
        ) {
            return;
        }
        event.preventDefault();
        toggle.focus({ preventScroll: true });
        state.pointerToggle = toggle;
        state.pointerStart = { x: event.clientX, y: event.clientY };
        const menu = menuFor(toggle);
        if (menu && state.menus.has(menu)) {
            hideMenu(menu);
        } else {
            showMenu(toggle);
        }
    });
    document.addEventListener('pointerup', (event) => {
        const item = event.target.closest('[data-ea-menu-item]');
        const start = state.pointerStart;
        if (
            state.pointerToggle &&
            start &&
            item &&
            !state.pointerToggle.contains(item) &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4
        ) {
            state.pointerToggle = null;
            item.click();
        }
        state.pointerStart = null;
    });
    document.addEventListener('pointercancel', () => {
        state.pointerToggle = null;
        state.pointerStart = null;
    });
    document.addEventListener('pointerover', (event) => {
        const item = event.target.closest('[data-ea-menu-item]');
        const parent = item?.closest('[data-ea-menu]');
        if (event.pointerType !== 'mouse' || !parent || !state.menus.has(parent)) {
            return;
        }
        clearTimeout(state.hoverTimer);
        state.hoverTimer = document.defaultView.setTimeout(() => {
            if (!state.menus.has(parent)) {
                return;
            }
            for (const [child] of state.menus) {
                if (child !== parent && parent.contains(child) && !child.contains(item) && menuFor(item) !== child) {
                    hideMenu(child);
                }
            }
            if (item.matches(MENU)) {
                showMenu(item);
            }
        }, 100);
    });
    document.addEventListener('keydown', (event) => keyboard(event, state));
    document.addEventListener('submit', (event) => {
        const submitter = event.submitter;
        if (submitter?.matches('[data-ea-dismiss="modal"]')) {
            queueMicrotask(() => {
                if (!event.defaultPrevented) {
                    closeDialog(
                        submitter.closest('dialog[data-ea-dialog]'),
                        submitter.dataset.eaDialogResult ?? 'close'
                    );
                }
            });
        }
    });
    document.addEventListener('focusin', (event) => {
        for (const [menu, toggle] of state.menus) {
            if (
                !menu.contains(event.target) &&
                !toggle.contains(event.target) &&
                !['false', 'inside'].includes(toggle.dataset.eaAutoClose)
            ) {
                hideMenu(menu);
            }
        }
    });
    document.addEventListener('ea.collection.item-added', (event) =>
        initEasyAdminUI(event.detail?.newElement ?? document)
    );
    const reposition = () => {
        for (const [menu, toggle] of state.menus) {
            position(menu, toggle);
        }
    };
    document.defaultView.addEventListener('resize', reposition);
    document.addEventListener('scroll', reposition, true);
}

function keyboard(event, state) {
    if (event.defaultPrevented) {
        return;
    }
    const collapse = event.target.closest('[data-ea-toggle="collapse"]');
    if (collapse && event.key === ' ') {
        collapse.click();
        event.preventDefault();
        return;
    }
    if (event.key === 'Escape' && state.menus.size > 0) {
        hideMenu(event.target.closest('[data-ea-menu]') ?? [...state.menus.keys()].at(-1), true);
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    if (event.key === 'Tab' && state.dialogs.size > 0) {
        const dialog = [...state.dialogs.keys()].at(-1);
        const focusable = [
            ...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[contenteditable="true"]'),
        ].filter(
            (element) =>
                element.tabIndex >= 0 &&
                !element.matches(':disabled,[disabled]') &&
                !element.closest('[inert]') &&
                element.getClientRects().length > 0
        );
        const first = focusable[0] ?? dialog;
        const last = focusable.at(-1) ?? dialog;
        if ((event.shiftKey && event.target === first) || (!event.shiftKey && event.target === last)) {
            (event.shiftKey ? last : first).focus();
            event.preventDefault();
            return;
        }
    }
    if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target.matches('input,textarea,select,[contenteditable="true"]')
    ) {
        return;
    }
    const tab = event.target.closest(TAB);
    if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        const list = tab.closest('[data-ea-tab-list]');
        const tabs = [...list.querySelectorAll(TAB)].filter(
            (item) => item.closest('[data-ea-tab-list]') === list && !item.matches('[aria-disabled="true"],[disabled]')
        );
        const step = (event.key === 'ArrowRight' ? 1 : -1) * (getComputedStyle(tab).direction === 'rtl' ? -1 : 1);
        const next =
            event.key === 'Home'
                ? tabs[0]
                : event.key === 'End'
                  ? tabs.at(-1)
                  : tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length];
        activateTab(next);
        next.focus();
        event.preventDefault();
        return;
    }
    const toggle = event.target.closest(MENU);
    const item = event.target.closest('[data-ea-menu-item]');
    const menu = item?.closest('[data-ea-menu]');
    if (toggle && !menu && ['ArrowDown', 'ArrowUp', ' '].includes(event.key)) {
        showMenu(toggle, event.key === 'ArrowUp' ? 'last' : 'first');
        event.preventDefault();
        return;
    }
    if (!menu || !state.menus.has(menu)) {
        return;
    }
    const options = items(menu);
    const rtl = getComputedStyle(item).direction === 'rtl';
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        const current = item.hasAttribute('data-ea-menu-split') ? item.previousElementSibling : item;
        const index = Math.max(0, options.indexOf(current));
        const next =
            event.key === 'Home'
                ? options[0]
                : event.key === 'End'
                  ? options.at(-1)
                  : options[Math.min(options.length - 1, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)))];
        next?.focus();
    } else if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
        const child = toggle ?? item.parentElement.querySelector('[data-ea-menu-split]');
        if (child) {
            showMenu(child, 'first');
        }
    } else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
        if (state.menus.get(menu)?.closest('[data-ea-menu]')) {
            hideMenu(menu, true);
        }
    } else if (event.key === ' ') {
        item.click();
    } else {
        return;
    }
    event.preventDefault();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initEasyAdminUI());
} else {
    initEasyAdminUI();
}
