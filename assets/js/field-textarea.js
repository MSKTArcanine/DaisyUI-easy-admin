import { registerWidget } from './widget-lifecycle';

class Autogrow {
    constructor(field) {
        this.field = field;
        this.mirror = null;
        this.refresh = this.autogrow.bind(this);
        this.field.addEventListener('input', this.refresh);
        for (const event of ['ea.tab.shown', 'ea.collapse.shown']) {
            document.addEventListener(event, this.refresh);
        }
        this.width = null;
        this.observer = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width !== this.width) {
                this.width = entry.contentRect.width;
                this.autogrow();
            }
        });
        this.observer.observe(field);
        this.autogrow();
    }

    autogrow() {
        this.field.style.overflow = 'hidden';
        this.field.style.resize = 'none';
        this.field.style.boxSizing = 'border-box';

        // the <textarea> can be inside a hidden tab or a collapsed panel; its computed width
        // is 'auto' there, so the mirror would compute a wrong height
        if (0 === this.field.getClientRects().length) {
            return;
        }

        // measuring a mirror avoids jumps when editing content in large textareas
        // (see https://github.com/EasyCorp/EasyAdminBundle/issues/7258)
        // TODO: remove this when `field-sizing: content` is widely supported (https://caniuse.com/?search=field-sizing)
        if (!this.mirror) {
            this.createMirror();
        }

        this.mirror.style.width = window.getComputedStyle(this.field).width;
        this.mirror.value = this.field.value;
        const borders = this.field.offsetHeight - this.field.clientHeight;
        this.field.style.height = `${this.mirror.scrollHeight + borders}px`;
    }

    dispose() {
        this.field.removeEventListener('input', this.refresh);
        for (const event of ['ea.tab.shown', 'ea.collapse.shown']) {
            document.removeEventListener(event, this.refresh);
        }
        this.observer.disconnect();
        this.mirror?.remove();
    }

    createMirror() {
        this.mirror = document.createElement('textarea');

        // position off-screen but rendered (so we can measure it)
        this.mirror.style.position = 'absolute';
        this.mirror.style.top = '-9999px';
        this.mirror.style.left = '-9999px';
        this.mirror.style.visibility = 'hidden';
        this.mirror.style.pointerEvents = 'none';
        this.mirror.tabIndex = -1;
        this.mirror.setAttribute('aria-hidden', 'true');
        this.mirror.setAttribute('data-ea-textarea-mirror', '');

        // copy the rows attribute to ensure minimum height is respected
        if (this.field.hasAttribute('rows')) {
            this.mirror.setAttribute('rows', this.field.getAttribute('rows'));
        }

        // copy computed styles that affect text layout
        const styles = window.getComputedStyle(this.field);
        const stylesToCopy = [
            'fontFamily',
            'fontSize',
            'fontWeight',
            'fontStyle',
            'letterSpacing',
            'lineHeight',
            'textTransform',
            'wordWrap',
            'wordSpacing',
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',
            'borderTopWidth',
            'borderRightWidth',
            'borderBottomWidth',
            'borderLeftWidth',
            'boxSizing',
        ];
        stylesToCopy.forEach((prop) => {
            this.mirror.style[prop] = styles[prop];
        });

        document.body.appendChild(this.mirror);
    }
}

registerWidget('textarea', '[data-ea-textarea-field]', (field) => new Autogrow(field));
