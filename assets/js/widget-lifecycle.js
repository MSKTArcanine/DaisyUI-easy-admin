const KEY = Symbol.for('easyadmin.widgets');

function elements(root, selector) {
    return [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
}

function dispose(definition, element, instance) {
    if (typeof instance === 'function') {
        instance();
    } else {
        instance?.dispose?.();
    }
    definition.instances.delete(element);
}

export function initWidgets(root = document) {
    for (const definition of (root.ownerDocument ?? root)[KEY]?.values() ?? []) {
        initialize(definition, root);
    }
}

export function disposeWidgets(root) {
    for (const definition of (root.ownerDocument ?? root)[KEY]?.values() ?? []) {
        for (const [element, instance] of definition.instances) {
            if (root === element || root.contains(element)) {
                dispose(definition, element, instance);
            }
        }
    }
}

function initialize(definition, root) {
    for (const element of elements(root, definition.selector)) {
        if (!definition.instances.has(element)) {
            definition.instances.set(element, definition.create(element));
        }
    }
}

export function registerWidget(name, selector, create) {
    const document = window.document;
    document[KEY] ??= new Map();
    const definitions = document[KEY];
    if (definitions.has(name)) {
        initialize(definitions.get(name), document);
        return;
    }
    const definition = { selector, create, instances: new Map() };
    definitions.set(name, definition);
    const start = () => initialize(definition, document);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
    document.addEventListener('ea.collection.item-added', (event) => {
        initialize(definition, event.detail?.newElement ?? document);
    });
    document.addEventListener('ea.filters.loaded', (event) => {
        initialize(definition, event.detail.body);
    });
    document.addEventListener('ea.collection.item-removed', () => {
        for (const [element, instance] of definition.instances) {
            if (!element.isConnected) {
                dispose(definition, element, instance);
            }
        }
    });
}
