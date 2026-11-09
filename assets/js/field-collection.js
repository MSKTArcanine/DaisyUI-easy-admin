import { initEasyAdminUI, setCollapse } from './ui/interactions';

const COLLECTION = '[data-ea-collection-field]';
const KEY = Symbol.for('easyadmin.collections');
const owned = (collection, selector) =>
    [...collection.querySelectorAll(selector)].filter((element) => element.closest(COLLECTION) === collection);
const items = (collection) => owned(collection, '.field-collection-item');

function updateItems(collection) {
    const entries = items(collection);
    for (const entry of entries) {
        entry.classList.remove('field-collection-item-first', 'field-collection-item-last');
    }
    entries[0]?.classList.add('field-collection-item-first');
    entries.at(-1)?.classList.add('field-collection-item-last');
}

function indexedPrefix(prefix, placeholder, index) {
    const position = prefix.lastIndexOf(placeholder);
    return position < 0 ? prefix : `${prefix.slice(0, position)}${index}${prefix.slice(position + placeholder.length)}`;
}

function prototypeHtml(collection, index) {
    const placeholder = collection.dataset.formTypeNamePlaceholder;
    let html = collection.dataset.prototype;
    const document = collection.ownerDocument;
    const prototype = document.createElement('template');
    prototype.innerHTML = html;
    // use the outer entry's full prefix so an identical nested placeholder remains reusable
    const firstNamed = prototype.content.querySelector('[name]')?.getAttribute('name') ?? '';
    const firstId = prototype.content.querySelector('[id]')?.id ?? '';
    const namePosition = firstNamed.indexOf(`[${placeholder}]`);
    const idPosition = firstId.indexOf(placeholder);
    const namePrefix =
        collection.dataset.eaPrototypeName ||
        (namePosition < 0 ? '' : firstNamed.slice(0, namePosition + placeholder.length + 2));
    const idPrefix =
        collection.dataset.eaPrototypeId || (idPosition < 0 ? '' : firstId.slice(0, idPosition + placeholder.length));
    for (const prefix of [namePrefix, idPrefix]) {
        if (prefix && placeholder) {
            html = html.replaceAll(prefix, indexedPrefix(prefix, placeholder, index));
        }
    }
    prototype.innerHTML = html;
    const indexOuterValue = (value) =>
        value.replaceAll(`${placeholder}label__`, String(index)).replaceAll(placeholder, String(index));
    const nestedMetadata = new Set([
        'data-prototype',
        'data-form-type-name-placeholder',
        'data-ea-prototype-id',
        'data-ea-prototype-name',
    ]);
    for (const element of prototype.content.querySelectorAll('*')) {
        if (element.closest(COLLECTION)) {
            continue;
        }
        for (const attribute of element.attributes) {
            if (!nestedMetadata.has(attribute.name)) {
                element.setAttribute(attribute.name, indexOuterValue(attribute.value));
            }
        }
    }
    const walker = document.createTreeWalker(prototype.content, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        if (!walker.currentNode.parentElement?.closest(COLLECTION)) {
            walker.currentNode.textContent = indexOuterValue(walker.currentNode.textContent);
        }
    }
    return prototype.content;
}

function insertionPoint(collection) {
    for (const badge of owned(collection, '.collection-empty')) {
        badge.remove();
    }
    let container = owned(collection, '[data-ea-collection-items]')[0];
    if (container) {
        return container;
    }
    // existing overrides can retain their former compound/array insertion wrappers
    container = owned(collection, '[data-empty-collection]')[0];
    if (container) {
        return container;
    }
    const wrapper = owned(collection, '.ea-form-collection-items')[0];
    if (!wrapper) {
        return null;
    }
    container = collection.ownerDocument.createElement('div');
    container.setAttribute('data-ea-collection-items', 'true');
    wrapper.append(container);
    return container;
}

function activateScripts(root) {
    for (const script of root.querySelectorAll('script')) {
        const executable = script.ownerDocument.createElement('script');
        for (const attribute of script.attributes) {
            executable.setAttribute(attribute.name, attribute.value);
        }
        if (script.nonce) {
            executable.nonce = script.nonce;
        }
        if (!script.hasAttribute('async')) {
            executable.async = false;
        }
        executable.textContent = script.textContent;
        script.replaceWith(executable);
    }
}

export function initCollections(root = document) {
    const document = root.ownerDocument ?? root;
    if (!document[KEY]) {
        document[KEY] = true;
        document.addEventListener('click', (event) => {
            const add = event.target.closest('button.field-collection-add-button');
            const remove = event.target.closest('button.field-collection-delete-button');
            const button = add ?? remove;
            const collection = button?.closest(COLLECTION);
            if (!collection || button.disabled) {
                return;
            }
            if (add) {
                if (collection.dataset.allowAdd === 'false' || !collection.dataset.prototype) {
                    return;
                }
                const container = insertionPoint(collection);
                if (!container) {
                    return;
                }
                event.preventDefault();
                const index = Number.parseInt(collection.dataset.numItems, 10) || 0;
                const fragment = prototypeHtml(collection, index);
                const entry = fragment.querySelector('.field-collection-item');
                if (!entry) {
                    return;
                }
                // keep the monotonic counter independent of removals and nested collections
                collection.dataset.numItems = String(index + 1);
                container.append(fragment);
                activateScripts(entry);
                initEasyAdminUI(entry);
                const panel = [...entry.querySelectorAll('[data-ea-collapse],.accordion-collapse')].find(
                    (candidate) => candidate.closest('.field-collection-item') === entry
                );
                if (panel) {
                    setCollapse(panel, true);
                }
                updateItems(collection);
                document.dispatchEvent(
                    new CustomEvent('ea.collection.item-added', { detail: { newElement: entry, collection } })
                );
                return;
            }
            if (collection.dataset.allowDelete === 'false') {
                return;
            }
            const entry = remove.closest('.field-collection-item');
            if (!entry || entry.closest(COLLECTION) !== collection) {
                return;
            }
            event.preventDefault();
            entry.remove();
            updateItems(collection);
            document.dispatchEvent(
                new CustomEvent('ea.collection.item-removed', { detail: { deletedElement: entry, collection } })
            );
        });
        document.addEventListener('ea.collection.item-added', (event) => initCollections(event.detail.newElement));
    }
    const collections = [...(root.matches?.(COLLECTION) ? [root] : []), ...root.querySelectorAll(COLLECTION)];
    for (const collection of collections) {
        updateItems(collection);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCollections());
} else {
    initCollections();
}
