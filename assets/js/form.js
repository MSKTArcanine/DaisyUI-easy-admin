import DirtyForm from 'dirty-form';
import { setCollapse, setTabAsActive } from './ui/interactions';

const KEY = Symbol.for('easyadmin.forms');
const SELECTOR = '.ea-new-form,.ea-edit-form';
const controls = (form) => [...form.elements].filter((element) => element.willValidate && !element.disabled);
const invalidControls = (form) => controls(form).filter((element) => !element.validity.valid);
const submitterFor = (element) => element.closest('button,input[type="submit"],input[type="image"]');

class EasyAdminDirtyForm extends DirtyForm {
    #submissions = new WeakMap();

    handleSubmit(event) {
        if (event.target !== this.form) {
            return;
        }
        let submission = this.#submissions.get(event);
        if (!submission) {
            submission = { dirty: this.isDirty };
            this.#submissions.set(event, submission);
            // native dispatch can run microtasks between listeners; inspect cancellation after the entire event
            this.form.ownerDocument.defaultView.setTimeout(() => {
                if (event.defaultPrevented) {
                    this.isDirty ||= submission.dirty;
                }
                this.#submissions.delete(event);
            }, 0);
        }
        submission.dirty ||= this.isDirty;
        this.isDirty = false;
    }
}

function ancestors(element) {
    const result = [];
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        result.push(parent);
    }
    return result;
}

function tabFor(pane) {
    return [...pane.ownerDocument.querySelectorAll('[data-ea-toggle="tab"]')].find(
        (tab) => (tab.getAttribute('data-ea-target') ?? tab.getAttribute('href')) === `#${pane.id}`
    );
}

function fieldsetTitle(fieldset) {
    return [...fieldset.querySelectorAll('.form-fieldset-title-content')].find(
        (title) => title.closest('.form-fieldset') === fieldset
    );
}

function resetIndicators(state) {
    const containers = new Set([state.form, ...state.indicators]);
    for (const control of controls(state.form)) {
        for (const parent of ancestors(control)) {
            if (parent.matches('.tab-pane,[data-ea-tab-panel]')) {
                const tab = tabFor(parent);
                if (tab) {
                    containers.add(tab);
                }
            }
        }
    }
    for (const container of containers) {
        for (const badge of container.querySelectorAll(
            '[data-ea-error-count],.form-tabs-tablist .nav-item .badge-danger.badge:not(.tab-nav-item-badge),.form-fieldset-title-content .badge-danger.badge'
        )) {
            badge.remove();
        }
        container.classList.remove('has-error', 'has-fieldset-error');
    }
    state.indicators.clear();
    for (const control of state.clientInvalid.keys()) {
        const original = state.clientInvalid.get(control);
        original === null ? control.removeAttribute('aria-invalid') : control.setAttribute('aria-invalid', original);
    }
    state.clientInvalid.clear();
}

function showErrors(state, invalid) {
    resetIndicators(state);
    const counters = new Map();
    for (const control of invalid) {
        state.clientInvalid.set(control, control.getAttribute('aria-invalid'));
        control.setAttribute('aria-invalid', 'true');
        const row = control.closest('.form-group');
        if (row) {
            row.classList.add('has-error');
            state.indicators.add(row);
        }
        for (const parent of ancestors(control)) {
            if (parent.matches('.tab-pane,[data-ea-tab-panel]')) {
                const tab = tabFor(parent);
                if (tab) {
                    tab.classList.add('has-error');
                    state.indicators.add(tab);
                    counters.set(tab, (counters.get(tab) ?? 0) + 1);
                }
            }
            if (parent.matches('.form-fieldset')) {
                parent.classList.add('has-fieldset-error');
                state.indicators.add(parent);
                const title = fieldsetTitle(parent);
                if (title) {
                    counters.set(title, (counters.get(title) ?? 0) + 1);
                }
            }
            if (parent.matches('[data-ea-collapse]')) {
                setCollapse(parent, true);
            }
        }
    }
    for (const [container, count] of counters) {
        const badge = state.form.ownerDocument.createElement('span');
        badge.className = 'badge badge-error';
        badge.setAttribute('data-ea-error-count', '');
        badge.textContent = String(count);
        container.append(badge);
    }
    for (const parent of ancestors(invalid[0]).reverse()) {
        if (parent.matches('.tab-pane,[data-ea-tab-panel]')) {
            const tab = tabFor(parent);
            if (tab) {
                setTabAsActive(tab.id);
            }
        }
    }
    state.form.ownerDocument.dispatchEvent(
        new CustomEvent('ea.form.error', {
            cancelable: true,
            detail: { page: state.page, form: state.form },
        })
    );
    state.reporting = true;
    try {
        invalid[0].focus();
        invalid[0].reportValidity();
    } finally {
        state.reporting = false;
    }
}

function validate(state, submitter) {
    if (state.form.noValidate || submitter?.formNoValidate) {
        return true;
    }
    const invalid = invalidControls(state.form);
    if (invalid.length === 0) {
        resetIndicators(state);
        return true;
    }
    showErrors(state, invalid);
    return false;
}

export function initForms(root = document) {
    const document = root.ownerDocument ?? root;
    document[KEY] ??= { forms: new Map() };
    const registry = document[KEY];
    const forms = [...(root.matches?.(SELECTOR) ? [root] : []), ...root.querySelectorAll(SELECTOR)];
    for (const form of forms) {
        if (registry.forms.has(form)) {
            continue;
        }
        const state = {
            form,
            page: form.matches('.ea-new-form') ? 'new' : 'edit',
            dirty: new EasyAdminDirtyForm(form),
            indicators: new Set(),
            clientInvalid: new Map(),
            reporting: false,
            pendingInvalid: false,
            submitting: false,
        };
        registry.forms.set(form, state);
        form.addEventListener('submit', (event) => {
            if (state.submitting) {
                event.preventDefault();
                return;
            }
            const allowed = document.dispatchEvent(
                new CustomEvent('ea.form.submit', {
                    cancelable: true,
                    detail: { page: state.page, form },
                })
            );
            if (!allowed) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (event.defaultPrevented) {
                return;
            }
            state.submitting = true;
            document.defaultView.setTimeout(() => {
                if (event.defaultPrevented) {
                    state.submitting = false;
                }
            }, 0);
            // serialize the original submitter before disabling its associated buttons
            document.defaultView.setTimeout(() => {
                if (!event.defaultPrevented) {
                    for (const button of [...form.elements].filter((element) => element.type === 'submit')) {
                        button.disabled = true;
                    }
                }
            }, 1);
        });
    }
    if (!registry.bound) {
        registry.bound = true;
        bind(document, registry);
    }
}

function bind(document, registry) {
    document.addEventListener('click', (event) => {
        const row = event.target.closest('.form-group.has-error');
        if (registry.forms.has(row?.closest('form'))) {
            row.classList.remove('has-error');
        }
    });
    document.addEventListener(
        'click',
        (event) => {
            const button = submitterFor(event.target);
            const state = registry.forms.get(button?.form);
            if (button?.type !== 'submit' || !state) {
                return;
            }
            if (!validate(state, button)) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        true
    );
    document.addEventListener(
        'invalid',
        (event) => {
            const state = registry.forms.get(event.target.form);
            if (!state || state.reporting || state.form.noValidate) {
                return;
            }
            event.preventDefault();
            if (!state.pendingInvalid) {
                state.pendingInvalid = true;
                queueMicrotask(() => {
                    state.pendingInvalid = false;
                    const invalid = invalidControls(state.form);
                    if (invalid.length > 0) {
                        showErrors(state, invalid);
                    }
                });
            }
        },
        true
    );
    for (const name of ['input', 'change']) {
        document.addEventListener(name, (event) => {
            const state = registry.forms.get(event.target.form);
            if (!state || event.target.type === 'hidden' || event.target.disabled) {
                return;
            }
            state.dirty.checkValue(event);
            if (['checkbox', 'radio'].includes(event.target.type)) {
                state.dirty.isDirty = true;
            }
            if (event.target.validity?.valid && state.clientInvalid.has(event.target)) {
                const original = state.clientInvalid.get(event.target);
                original === null
                    ? event.target.removeAttribute('aria-invalid')
                    : event.target.setAttribute('aria-invalid', original);
                state.clientInvalid.delete(event.target);
                event.target.closest('.form-group')?.classList.remove('has-error');
            }
        });
    }
    for (const name of ['ea.collection.item-added', 'ea.collection.item-removed']) {
        document.addEventListener(name, (event) => {
            const form = event.detail?.collection?.closest('form');
            const state = registry.forms.get(form);
            if (state) {
                state.dirty.isDirty = true;
            }
            initForms(event.detail?.newElement ?? document);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initForms());
} else {
    initForms();
}
