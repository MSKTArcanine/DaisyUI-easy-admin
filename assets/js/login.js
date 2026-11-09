const key = Symbol.for('easyadmin.login-forms');
document[key] ??= new WeakSet();

function initLoginForms() {
    for (const form of document.querySelectorAll('.page-login .login-wrapper form')) {
        if (document[key].has(form)) {
            continue;
        }
        document[key].add(form);
        let submitting = false;
        form.addEventListener('submit', (event) => {
            if (event.defaultPrevented) {
                return;
            }
            if (submitting) {
                event.preventDefault();
                return;
            }
            submitting = true;
            // wait for all submit listeners and preserve the original submitter payload
            setTimeout(() => {
                if (event.defaultPrevented) {
                    submitting = false;
                    return;
                }
                for (const control of form.elements) {
                    if (control.type === 'submit') {
                        control.disabled = true;
                    }
                }
            }, 0);
        });
    }
}

initLoginForms();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginForms);
}
