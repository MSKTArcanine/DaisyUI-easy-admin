require('../css/form-type-code-editor.css');

import CodeMirror from 'codemirror';
import { registerWidget } from './widget-lifecycle';
import { connectWidgetValidation } from './widget-validation';

import 'codemirror/mode/css/css';
import 'codemirror/mode/dockerfile/dockerfile';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/nginx/nginx';
import 'codemirror/mode/php/php';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/twig/twig';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/yaml-frontmatter/yaml-frontmatter';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/addon/display/autorefresh';

registerWidget('code-editor', '[data-ea-code-editor-field]', (codeBlock) => {
    const originalForm = codeBlock.form;
    const editor = CodeMirror.fromTextArea(codeBlock, {
        leaveSubmitMethodAlone: true,
        autocapitalize: false,
        autocorrect: false,
        indentWithTabs: codeBlock.dataset.indentWithTabs === 'true',
        lineNumbers: codeBlock.dataset.showLineNumbers === 'true',
        lineWrapping: true,
        mode: codeBlock.dataset.language,
        scrollbarStyle: 'native',
        spellcheck: false,
        tabSize: codeBlock.dataset.tabSize,
        theme: 'default',
        autoRefresh: true,
        readOnly: codeBlock.disabled || codeBlock.readOnly,
    });
    const wrapper = editor.getWrapperElement();
    const input = editor.getInputField();
    const label = [...codeBlock.ownerDocument.querySelectorAll('label[for]')].find(
        (label) => label.htmlFor === codeBlock.id
    );
    if (label && !codeBlock.hasAttribute('aria-label') && !codeBlock.hasAttribute('aria-labelledby')) {
        label.id ||= `${codeBlock.id}-label`;
        input.setAttribute('aria-labelledby', label.id);
    }
    input.setAttribute('aria-required', String(codeBlock.required));
    input.setAttribute('aria-disabled', String(codeBlock.disabled));
    const validation = connectWidgetValidation(codeBlock, input, wrapper);
    const changed = () => {
        editor.save();
        validation.update();
        codeBlock.dispatchEvent(new Event('input', { bubbles: true }));
    };
    editor.on('change', changed);
    if (codeBlock.dataset.numberOfRows) {
        // include vertical padding and borders so the final line remains fully visible
        const linesStyle = getComputedStyle(wrapper.querySelector('.CodeMirror-lines'));
        const padding = Number.parseFloat(linesStyle.paddingTop) + Number.parseFloat(linesStyle.paddingBottom);
        const border = wrapper.offsetHeight - wrapper.clientHeight;
        const height = editor.defaultTextHeight() * Number(codeBlock.dataset.numberOfRows) + padding + border;
        wrapper.style.setProperty('height', `${height}px`, 'important');
        wrapper.style.setProperty('max-block-size', 'none');
    }
    const reveal = () => {
        if (wrapper.getClientRects().length) {
            editor.refresh();
        }
    };
    for (const name of ['ea.tab.shown', 'ea.collapse.shown']) {
        document.addEventListener(name, reveal);
    }
    return {
        dispose() {
            for (const name of ['ea.tab.shown', 'ea.collapse.shown']) {
                document.removeEventListener(name, reveal);
            }
            originalForm?.removeEventListener('submit', editor.save);
            editor.setOption('autoRefresh', false);
            editor.off('change', changed);
            validation.dispose();
            editor.toTextArea();
        },
    };
});
