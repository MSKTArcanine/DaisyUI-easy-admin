import { createPopper } from '@popperjs/core';
import createDOMPurify from 'dompurify';

const KEY = Symbol.for('easyadmin.overlays');
const SELECTOR = '[data-ea-toggle="tooltip"],[data-ea-toggle="popover"]';
const tags =
    'a area b br col code dd div dl dt em hr h1 h2 h3 h4 h5 h6 i img li ol p pre s small span sub sup strong u ul'.split(
        ' '
    );
const globals = ['class', 'dir', 'id', 'lang', 'role'];
const attributes = {
    a: ['target', 'href', 'title', 'rel'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height'],
};
const purifier = createDOMPurify(window);
purifier.addHook('uponSanitizeAttribute', (node, data) => {
    if (
        !globals.includes(data.attrName) &&
        !data.attrName.startsWith('aria-') &&
        !attributes[node.localName]?.includes(data.attrName)
    ) {
        data.keepAttr = false;
    }
});
const sanitize = (html) =>
    purifier.sanitize(html, {
        ALLOWED_TAGS: tags,
        ALLOWED_ATTR: [...globals, ...new Set(Object.values(attributes).flat())],
        ALLOW_ARIA_ATTR: true,
        ALLOW_DATA_ATTR: false,
    });
const option = (element, key, fallback = null) => element.getAttribute(`data-ea-${key}`) ?? fallback;
const emit = (entry, phase, cancelable = false) =>
    entry.trigger.dispatchEvent(
        new CustomEvent(`ea.${entry.type}.${phase}`, {
            bubbles: true,
            cancelable,
            detail: { overlay: entry.tip },
        })
    );
const query = (document, selector) => {
    try {
        return document.querySelector(selector);
    } catch (error) {
        if (error.name === 'SyntaxError') {
            return null;
        }
        throw error;
    }
};
const delayFor = (entry, phase) => {
    const value = option(entry.trigger, 'delay', '0');
    let delay = Number(value);
    if (value.startsWith('{')) {
        try {
            delay = Number(JSON.parse(value)[phase] ?? 0);
        } catch (error) {
            if (error.name !== 'SyntaxError') {
                throw error;
            }
            delay = 0;
        }
    }
    return Number.isFinite(delay) && delay >= 0 ? delay : 0;
};

export function initOverlays(root = document) {
    const document = root.ownerDocument ?? root;
    document[KEY] ??= { entries: new Map(), sequence: 0 };
    const state = document[KEY];
    const triggers = [...(root.matches?.(SELECTOR) ? [root] : []), ...root.querySelectorAll(SELECTOR)];
    for (const trigger of triggers) {
        if (state.entries.has(trigger)) {
            continue;
        }
        const title = trigger.getAttribute('title');
        if (title) {
            trigger.setAttribute('data-ea-original-title', title);
            trigger.removeAttribute('title');
            if (
                !trigger.hasAttribute('aria-label') &&
                !trigger.hasAttribute('aria-labelledby') &&
                !trigger.textContent.trim()
            ) {
                trigger.setAttribute('aria-label', title);
            }
        }
        const type = option(trigger, 'toggle');
        state.entries.set(trigger, {
            trigger,
            type,
            document,
            state,
            tip: null,
            popper: null,
            active: new Set(),
            triggers: option(trigger, 'trigger', type === 'tooltip' ? 'hover focus' : 'click').split(/\s+/),
        });
    }
    for (const [trigger, entry] of state.entries) {
        if (!trigger.isConnected) {
            entry.active.clear();
            hide(entry, true);
            state.entries.delete(trigger);
        }
    }
    if (!state.bound) {
        state.bound = true;
        bind(document, state);
    }
}

function content(entry, container, value) {
    if (option(entry.trigger, 'html') === 'true') {
        container.innerHTML = sanitize(value);
    } else {
        container.textContent = value;
    }
}

function show(entry) {
    clearTimeout(entry.timer);
    if (
        entry.tip ||
        !entry.trigger.isConnected ||
        entry.trigger.getClientRects().length === 0 ||
        getComputedStyle(entry.trigger).visibility !== 'visible' ||
        entry.trigger.matches(':disabled,[disabled],[aria-disabled="true"],.disabled,.btn-disabled')
    ) {
        return;
    }
    const title = option(entry.trigger, 'title', option(entry.trigger, 'original-title', ''));
    const body = option(entry.trigger, 'content', '');
    if ((!title && (entry.type !== 'popover' || !body)) || !emit(entry, 'show', true)) {
        return;
    }
    const tip = entry.document.createElement('div');
    tip.id = `ea-overlay-${++entry.state.sequence}`;
    tip.className = `ea-overlay ea-${entry.type}`;
    tip.setAttribute('data-ea-overlay', entry.type);
    tip.setAttribute('role', 'tooltip');
    for (const className of option(entry.trigger, 'custom-class', '').split(/\s+/).filter(Boolean)) {
        tip.classList.add(className);
    }
    if (entry.type === 'tooltip') {
        content(entry, tip, title);
    } else {
        if (title) {
            const heading = entry.document.createElement('h3');
            heading.className = 'ea-popover-title';
            content(entry, heading, title);
            tip.append(heading);
        }
        if (body) {
            const bodyElement = entry.document.createElement('div');
            bodyElement.className = 'ea-popover-body';
            content(entry, bodyElement, body);
            tip.append(bodyElement);
        }
    }
    const containerSelector = option(entry.trigger, 'container');
    const requestedContainer =
        (containerSelector && query(entry.document, containerSelector)) ??
        entry.trigger.closest('[data-ea-ui]') ??
        entry.document.body;
    const owner =
        entry.trigger.closest('dialog[open]') ??
        (entry.document.body.classList.contains('ea-mobile-sidebar-visible')
            ? entry.trigger.closest('[data-ea-sidebar],.sidebar-wrapper')
            : null);
    const container = owner && !owner.contains(requestedContainer) ? owner : requestedContainer;
    container.append(tip);
    entry.tip = tip;
    const descriptions = new Set((entry.trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
    descriptions.add(tip.id);
    entry.trigger.setAttribute('aria-describedby', [...descriptions].join(' '));
    let placement = option(entry.trigger, 'placement', entry.type === 'tooltip' ? 'top' : 'right');
    if (!/^(auto|top|bottom|left|right)(-(start|end))?$/.test(placement)) {
        placement = 'top';
    }
    if (getComputedStyle(entry.trigger).direction === 'rtl') {
        placement = placement.replace(/^(left|right)/, (side) => (side === 'left' ? 'right' : 'left'));
    }
    const offset = option(entry.trigger, 'offset', entry.type === 'tooltip' ? '0,6' : '0,8')
        .split(',')
        .map(Number);
    const boundarySelector = option(entry.trigger, 'boundary');
    const boundary =
        boundarySelector && !['clippingParents', 'viewport'].includes(boundarySelector)
            ? (query(entry.document, boundarySelector) ?? 'clippingParents')
            : boundarySelector === 'viewport'
              ? entry.document.documentElement
              : 'clippingParents';
    entry.popper = createPopper(entry.trigger, tip, {
        placement,
        strategy: 'fixed',
        modifiers: [
            {
                name: 'offset',
                options: { offset: offset.length === 2 && offset.every(Number.isFinite) ? offset : [0, 6] },
            },
            { name: 'flip', options: { boundary, padding: 8, fallbackPlacements: ['top', 'right', 'bottom', 'left'] } },
            { name: 'preventOverflow', options: { boundary, padding: 8 } },
        ],
    });
    emit(entry, 'shown');
}

function hide(entry, force = false) {
    clearTimeout(entry.timer);
    if (!entry.tip || (!force && !emit(entry, 'hide', true))) {
        return;
    }
    if (force) {
        emit(entry, 'hide');
    }
    const descriptions = (entry.trigger.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && id !== entry.tip.id);
    if (descriptions.length > 0) {
        entry.trigger.setAttribute('aria-describedby', descriptions.join(' '));
    } else {
        entry.trigger.removeAttribute('aria-describedby');
    }
    entry.popper?.destroy();
    entry.popper = null;
    entry.tip.remove();
    entry.tip = null;
    emit(entry, 'hidden');
}

function activate(entry, kind, active) {
    if (entry.restoringFocus && kind === 'focus') {
        return;
    }
    if (!entry.triggers.includes(kind)) {
        return;
    }
    active ? entry.active.add(kind) : entry.active.delete(kind);
    clearTimeout(entry.timer);
    const phase = entry.active.size > 0 ? 'show' : 'hide';
    const delay = delayFor(entry, phase);
    if (delay > 0) {
        entry.timer = entry.document.defaultView.setTimeout(
            () => (phase === 'show' ? show(entry) : hide(entry)),
            delay
        );
    } else {
        phase === 'show' ? show(entry) : hide(entry);
    }
}

function bind(document, state) {
    const cleanup = (container) => {
        for (const entry of state.entries.values()) {
            if (!entry.trigger.isConnected || container?.contains(entry.trigger)) {
                entry.active.clear();
                hide(entry, true);
                if (!entry.trigger.isConnected) {
                    state.entries.delete(entry.trigger);
                }
            }
        }
    };
    for (const name of ['ea.modal.hidden', 'ea.collapse.hidden', 'ea.sidebar.hidden']) {
        document.addEventListener(name, (event) => cleanup(event.target));
    }
    document.addEventListener('ea.menu.hidden', (event) => cleanup(event.detail.menu));
    document.addEventListener('ea.collection.item-removed', () => cleanup());
    const entryFor = (event) => state.entries.get(event.target.closest(SELECTOR));
    document.addEventListener(
        'click',
        (event) => {
            const entry = entryFor(event);
            if (entry?.triggers.includes('click') && entry.trigger.matches('a[href="#"]')) {
                event.preventDefault();
            }
        },
        true
    );
    document.addEventListener('pointerover', (event) => {
        const entry = entryFor(event);
        if (entry && event.pointerType !== 'touch' && !entry.trigger.contains(event.relatedTarget)) {
            activate(entry, 'hover', true);
        }
    });
    document.addEventListener('pointerout', (event) => {
        const entry = entryFor(event);
        if (entry && !entry.trigger.contains(event.relatedTarget)) {
            activate(entry, 'hover', false);
        }
    });
    document.addEventListener('focusin', (event) => {
        const entry = entryFor(event);
        if (entry) {
            activate(entry, 'focus', true);
        }
    });
    document.addEventListener('focusout', (event) => {
        const entry = entryFor(event);
        if (entry && !entry.trigger.contains(event.relatedTarget)) {
            activate(entry, 'focus', false);
        }
    });
    document.addEventListener('click', (event) => {
        const entry = entryFor(event);
        if (entry?.triggers.includes('click')) {
            if (entry.trigger.matches('a[href="#"]')) {
                event.preventDefault();
            }
            activate(entry, 'click', !entry.active.has('click'));
        }
    });
    document.defaultView.addEventListener(
        'keydown',
        (event) => {
            if (event.key !== 'Escape') {
                return;
            }
            for (const entry of state.entries.values()) {
                if (entry.tip) {
                    const restore = entry.tip.contains(document.activeElement);
                    entry.active.clear();
                    hide(entry);
                    if (restore) {
                        entry.restoringFocus = true;
                        try {
                            entry.trigger.focus({ preventScroll: true });
                        } finally {
                            entry.restoringFocus = false;
                        }
                    }
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        },
        true
    );
}
