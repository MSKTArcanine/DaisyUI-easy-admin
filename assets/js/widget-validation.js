export function connectWidgetValidation(control, target, container = target) {
    for (const name of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-invalid']) {
        if (control.hasAttribute(name) && !target.hasAttribute(name)) {
            target.setAttribute(name, control.getAttribute(name));
        }
    }
    if (!control.form) {
        return { update() {}, dispose() {} };
    }
    const document = control.ownerDocument;
    const previousTarget = control.getAttribute('data-ea-validation-target');
    target.id ||= `${control.id}-editor-input`;
    control.setAttribute('data-ea-validation-target', target.id);
    const originalInvalid = target.getAttribute('aria-invalid');
    let error = null;
    let exposed = false;
    const clear = () => {
        if (!error) {
            return;
        }
        const descriptions = (target.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .filter((id) => id && id !== error.id);
        descriptions.length
            ? target.setAttribute('aria-describedby', descriptions.join(' '))
            : target.removeAttribute('aria-describedby');
        originalInvalid === null
            ? target.removeAttribute('aria-invalid')
            : target.setAttribute('aria-invalid', originalInvalid);
        container.removeAttribute('data-ea-widget-invalid');
        error.remove();
        error = null;
    };
    const update = () => {
        if (control.disabled || control.validity.valid) {
            clear();
            return;
        }
        if (!exposed) {
            return;
        }
        if (!error) {
            error = document.createElement('div');
            error.id = `${control.id}-widget-error`;
            error.className = 'ea-form-errors invalid-feedback';
            error.setAttribute('data-ea-widget-error', control.id);
            error.setAttribute('role', 'alert');
            container.after(error);
            const descriptions = new Set((target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
            descriptions.add(error.id);
            target.setAttribute('aria-describedby', [...descriptions].join(' '));
        }
        error.textContent = control.validationMessage;
        target.setAttribute('aria-invalid', 'true');
        container.setAttribute('data-ea-widget-invalid', 'true');
    };
    const show = () => {
        exposed = true;
        update();
    };
    const invalid = (event) => {
        event.preventDefault();
        show();
        target.focus();
    };
    const formError = (event) => {
        if (event.detail.form === control.form) {
            show();
        }
    };
    control.addEventListener('invalid', invalid);
    document.addEventListener('ea.form.error', formError);
    return {
        update,
        dispose() {
            clear();
            control.removeEventListener('invalid', invalid);
            document.removeEventListener('ea.form.error', formError);
            previousTarget === null
                ? control.removeAttribute('data-ea-validation-target')
                : control.setAttribute('data-ea-validation-target', previousTarget);
        },
    };
}
