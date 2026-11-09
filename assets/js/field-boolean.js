import { registerWidget } from './widget-lifecycle';

registerWidget('boolean', '.field-boolean .ea-switch input[type="checkbox"][data-toggle-url]', (field) => {
    const events = new AbortController();
    let pending = false;
    let value = field.checked;
    field.addEventListener(
        'change',
        async () => {
            if (field.disabled || pending) {
                field.checked = value;
                return;
            }
            const newValue = field.checked;
            const busy = field.getAttribute('aria-busy');
            pending = true;
            field.disabled = true;
            field.setAttribute('aria-busy', 'true');
            try {
                const response = await fetch(
                    `${field.getAttribute('data-toggle-url')}&newValue=${newValue.toString()}`,
                    {
                        method: 'PATCH',
                        // preserve the existing XHR request contract
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    }
                );
                const content = await response.text();
                if (!response.ok || (response.redirected && content !== (newValue ? '1' : '0'))) {
                    field.checked = value;
                    field.closest('.ea-switch').classList.add('ea-switch-disabled');
                    return;
                }
                value = newValue;
                field.checked = newValue;
                field.disabled = false;
            } catch {
                field.checked = value;
                field.closest('.ea-switch').classList.add('ea-switch-disabled');
            } finally {
                pending = false;
                busy === null ? field.removeAttribute('aria-busy') : field.setAttribute('aria-busy', busy);
            }
        },
        { signal: events.signal }
    );
    return () => events.abort();
});
