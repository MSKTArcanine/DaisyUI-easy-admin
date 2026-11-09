require('../css/form-type-text-editor.css');

import Trix from 'trix/dist/trix.esm';
import { registerWidget } from './widget-lifecycle';
import { connectWidgetValidation } from './widget-validation';

const KEY = Symbol.for('easyadmin.trix');
document[KEY] ??= { prepared: new WeakSet(), bound: false, trix: Trix };
const state = document[KEY];
// Trix assigns its global on every import; keep the instance used by existing custom elements
window.Trix = state.trix;

function editorFor(control) {
    return [...control.ownerDocument.querySelectorAll('trix-editor[input]')].find(
        (editor) => editor.getAttribute('input') === control.id
    );
}

function mergeConfig(source, target) {
    for (const [key, value] of Object.entries(source)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) {
            continue;
        }
        if (value !== null && typeof value === 'object') {
            target[key] ??= Array.isArray(value) ? [] : {};
            mergeConfig(value, target[key]);
        } else {
            target[key] = value;
        }
    }
}

function prepare(control) {
    if (state.prepared.has(control)) {
        return;
    }
    state.prepared.add(control);
    const config = JSON.parse(control.getAttribute('data-trix-editor-config') ?? 'null');
    if (config) {
        mergeConfig(config, window.Trix.config);
    }
    if (!control.hasAttribute('data-ea-trix-is-required')) {
        control.dataset.eaTrixIsRequired = String(control.required);
    }
    control.required = false;
}

if (!state.bound) {
    state.bound = true;
    document.addEventListener('trix-before-initialize', (event) => {
        const control = event.target.inputElement;
        if (control?.matches('textarea.ea-text-editor-content')) {
            prepare(control);
        }
    });
}

registerWidget('text-editor', 'textarea.ea-text-editor-content', (control) => {
    prepare(control);
    const editor = editorFor(control);
    if (!editor) {
        return null;
    }
    const required = control.dataset.eaTrixIsRequired === 'true';
    editor.id ||= `${control.id}-editor`;
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-required', String(required));
    editor.setAttribute('aria-disabled', String(control.disabled));
    const applyReadonly = () => {
        if (control.readOnly) {
            editor.setAttribute('contenteditable', 'false');
            editor.setAttribute('aria-readonly', 'true');
            if (!editor.hasAttribute('tabindex')) {
                editor.tabIndex = 0;
            }
            if (editor.toolbarElement) {
                editor.toolbarElement.inert = true;
            }
        }
    };
    const preventReadonlyEdit = (event) => {
        if (control.readOnly) {
            event.preventDefault();
        }
    };
    editor.addEventListener('trix-initialize', applyReadonly);
    editor.addEventListener('beforeinput', preventReadonlyEdit);
    editor.addEventListener('trix-file-accept', preventReadonlyEdit);
    applyReadonly();
    const label = [...document.querySelectorAll('label[for]')].find((label) => label.htmlFor === control.id);
    if (label && !control.hasAttribute('aria-label') && !control.hasAttribute('aria-labelledby')) {
        label.id ||= `${control.id}-label`;
        editor.setAttribute('aria-labelledby', label.id);
    }
    const validation = connectWidgetValidation(control, editor, editor.closest('.ea-text-editor-wrapper') ?? editor);
    let ownedMessage = null;
    const updateValidity = () => {
        const text = editor.editor?.getDocument().toString() ?? control.value;
        const empty = text.trim() === '';
        if (required && empty && !control.disabled) {
            if (!control.validity.customError || control.validationMessage === ownedMessage) {
                ownedMessage = localizedRequiredMessage();
                control.setCustomValidity(ownedMessage);
            }
        } else {
            if (ownedMessage !== null && control.validationMessage === ownedMessage) {
                control.setCustomValidity('');
            }
            ownedMessage = null;
        }
        validation.update();
    };
    const change = () => {
        updateValidity();
        // Trix updates its backing textarea without dispatching a native input event
        control.dispatchEvent(new Event('input', { bubbles: true }));
    };
    editor.addEventListener('trix-change', change);
    editor.addEventListener('trix-initialize', updateValidity);
    updateValidity();
    let sizeStyle = null;
    if (control.dataset.numberOfRows) {
        const rows = Number(control.dataset.numberOfRows);
        if (Number.isFinite(rows) && rows > 0) {
            sizeStyle = document.createElement('style');
            sizeStyle.id = `ea-trix-editor-size-${control.id}`;
            const nonce = document.querySelector('meta[name="csp-nonce"]')?.content;
            if (nonce) {
                sizeStyle.nonce = nonce;
            }
            sizeStyle.textContent = `#${CSS.escape(editor.id)} { min-block-size: ${21 * rows}px; }`;
            document.head.append(sizeStyle);
        }
    }
    return {
        dispose() {
            editor.removeEventListener('trix-initialize', applyReadonly);
            editor.removeEventListener('beforeinput', preventReadonlyEdit);
            editor.removeEventListener('trix-file-accept', preventReadonlyEdit);
            editor.removeEventListener('trix-change', change);
            editor.removeEventListener('trix-initialize', updateValidity);
            validation.dispose();
            sizeStyle?.remove();
        },
    };
});

function localizedRequiredMessage() {
    const requiredFieldMessage = {
        ar: 'يُرجى ملء هذا الحقل.',
        bg: 'Моля, попълнете това поле',
        ca: 'Empleneu aquest camp',
        cs: 'Vyplňte prosím toto pole',
        da: 'Udfyld dette felt',
        de: 'Füllen Sie dieses Feld aus',
        el: 'Συμπληρώστε αυτό το πεδίο',
        en: 'Please fill in this field',
        es: 'Completa este campo',
        eu: 'Bete eremu hau',
        fa: 'لطفاً این قسمت را تکمیل کنید.',
        fi: 'Täytä tämä kenttä',
        fr: 'Veuillez renseigner ce champ',
        gl: 'Completa este campo',
        hr: 'Ispunite ovo polje',
        hu: 'Kérjük, töltse ki ezt a mezőt',
        it: 'Compila questo campo',
        lt: 'Užpildykite šį lauką',
        nl: 'Vul dit veld in',
        no: 'Vennligst fyll ut dette feltet',
        pl: 'Wypełnij to pole',
        pt: 'Preencha este campo',
        pt_BR: 'Preencha este campo',
        ro: 'Completează acest câmp',
        ru: 'Заполните это поле',
        sl: 'Izpolnite to polje',
        sr_RS: 'Попуните ово поље',
        sv: 'Fyll i det här fältet',
        tr: 'Lütfen bu alanı doldurun',
        uk: 'Заповніть це поле',
        zh_CN: '请填写此字段',
    };

    return requiredFieldMessage[document.documentElement.lang] || 'Please fill in this field';
}
