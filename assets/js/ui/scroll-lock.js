const KEY = Symbol.for('easyadmin.scroll-lock');

export function lockScroll(document, owner, body = false) {
    if (!document[KEY]) {
        document[KEY] = {
            html: document.documentElement.style.overflow,
            body: document.body.style.overflow,
            owners: new Map(),
        };
    }
    document[KEY].owners.set(owner, body);
    update(document);
}

export function unlockScroll(document, owner) {
    const state = document[KEY];
    if (!state) {
        return;
    }
    state.owners.delete(owner);
    update(document);
    if (state.owners.size === 0) {
        delete document[KEY];
    }
}

function update(document) {
    const state = document[KEY];
    document.documentElement.style.overflow = state.owners.size > 0 ? 'hidden' : state.html;
    document.body.style.overflow = [...state.owners.values()].includes(true) ? 'hidden' : state.body;
}
