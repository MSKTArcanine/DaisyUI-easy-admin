import Mark from 'mark.js/src/vanilla';
import Autocomplete from './autocomplete';
import { sanitizeUrl, toggleVisibilityClasses } from './helpers';
import { initOverlays } from './overlays';
import { initTabs } from './tabs';
import { closeDialog, initEasyAdminUI } from './ui/interactions';
import { initShell } from './ui/shell';
import { disposeWidgets, initWidgets } from './widget-lifecycle';

const buttonColorClasses = [
    'btn-neutral',
    'btn-secondary',
    'btn-primary',
    'btn-success',
    'btn-warning',
    'btn-danger',
    'btn-error',
    'btn-info',
];
const confirmationButtonColorClass = (actionColor) =>
    'danger' === (actionColor || 'danger') ? 'btn-error' : 'btn-primary';

const KEY = Symbol.for('easyadmin.crud');

export function initCrud(root = document) {
    const document = root.ownerDocument ?? root;
    document[KEY] ??= new CrudApp();
    document[KEY].init(root);
    window.EasyAdminApp = document[KEY];
    return document[KEY];
}

class CrudApp {
    #initialized = new WeakMap();
    #pendingAction = null;
    #pendingBatchAction = null;
    #filterRequest = null;
    #batchTitleTemplate = null;
    #actionTitleTemplate = null;
    #actionButtonLabel = null;
    #lastBatchCheckbox = null;

    constructor() {
        this.#removeHashFormUrl();
        document.addEventListener('ea.collection.item-added', (event) =>
            this.init(event.detail?.newElement ?? document)
        );
    }

    init(root = document) {
        initEasyAdminUI(root);
        initShell();

        initTabs();
        this.#createSearchHighlight();
        this.#createSearchInputAutoSizing();
        this.#createFilters();
        this.#createAutoCompleteFields();
        this.#createBatchActions();
        this.#createActionConfirmationModals();
        this.#createDefaultRowAction();
        initOverlays(root);
        this.#createContentHelp();
        this.#createActionHandlers();
        initWidgets(root);
    }

    #initialize(element, key) {
        if (!element) {
            return false;
        }
        const keys = this.#initialized.get(element) ?? new Set();
        if (keys.has(key)) {
            return false;
        }
        keys.add(key);
        this.#initialized.set(element, keys);
        return true;
    }

    // When using tabs in forms, the selected tab is persisted (in the URL hash) so you
    // can see the same tab when reloading the page (e.g. '#tab-contact-information').
    // This method removes the hash from URL in the index page to not show form-related
    // information in the index page
    #removeHashFormUrl() {
        if (!window.location.href.includes('#')) {
            return;
        }

        if (!document.querySelector('body').classList.contains('ea-index')) {
            return;
        }

        // don't set the hash to '' because that also removes the query parameters
        const urlParts = window.location.href.split('#');
        const urlWithoutHash = urlParts[0];
        window.history.replaceState({}, '', urlWithoutHash);
    }

    #createSearchHighlight() {
        const searchElement = document.querySelector('.form-action-search [name="query"]');
        if (null === searchElement) {
            return;
        }
        if (!this.#initialize(searchElement, 'highlight')) {
            return;
        }

        const searchQuery = searchElement.value;
        if ('' === searchQuery.trim()) {
            return;
        }

        // 'foo "bar baz" qux' => ['foo', 'bar baz', 'qux']
        const tokenizeString = (string) => {
            const regex = /"([^"\\]*(\\.[^"\\]*)*)"|\S+/g;
            const tokens = [];

            let match = regex.exec(string);
            while (null !== match) {
                tokens.push(match[0].replaceAll('"', '').trim());
                match = regex.exec(string);
            }

            return tokens;
        };

        const searchQueryTerms = tokenizeString(searchElement.value);

        const elementsToHighlight = document.querySelectorAll('.datagrid [data-id] .searchable');
        const highlighter = new Mark(elementsToHighlight);
        highlighter.mark(searchQueryTerms, {
            separateWordSearch: false,
            done: () => this.#keepHighlightedTextTogether(elementsToHighlight),
        });
    }

    // in flex and grid containers (e.g. badges) each piece of a highlighted text would become a
    // separate item, adding the gap of the container between them and removing the spaces around them
    #keepHighlightedTextTogether(highlightedElements) {
        const containers = new Set();
        for (const element of highlightedElements) {
            for (const mark of element.querySelectorAll('mark')) {
                containers.add(mark.parentElement);
            }
        }

        const isTextPiece = (node) => Node.TEXT_NODE === node.nodeType || 'MARK' === node.nodeName;
        for (const container of containers) {
            const { display } = getComputedStyle(container);
            if (!display.includes('flex') && !display.includes('grid')) {
                continue;
            }

            for (const mark of container.querySelectorAll(':scope > mark')) {
                if (mark.parentElement !== container) {
                    continue;
                }

                let first = mark;
                while (first.previousSibling && isTextPiece(first.previousSibling)) {
                    first = first.previousSibling;
                }

                const wrapper = document.createElement('span');
                container.insertBefore(wrapper, first);
                while (wrapper.nextSibling && isTextPiece(wrapper.nextSibling)) {
                    wrapper.append(wrapper.nextSibling);
                }
            }
        }
    }

    #createSearchInputAutoSizing() {
        const searchElement = document.querySelector('.content-search-label input[type="search"]');
        if (null === searchElement) {
            return;
        }
        if (!this.#initialize(searchElement, 'autosize')) {
            return;
        }

        // keep the parent label's data-value in sync with the typed text, so the
        // ::after pseudo-element used to auto-size the search input grows while typing
        searchElement.addEventListener('input', () => {
            searchElement.parentNode.dataset.value = searchElement.value;
        });
    }

    #createFilters() {
        const filterButton = document.querySelector('.datagrid-filters .action-filters-button');
        if (!filterButton) {
            return;
        }
        const selector = filterButton.getAttribute('data-ea-target') ?? filterButton.getAttribute('data-bs-target');
        const filterModal = selector ? document.querySelector(selector) : null;
        const filtersUrl = sanitizeUrl(
            filterButton.getAttribute('data-href') ?? filterButton.getAttribute('href'),
            true
        );
        if (!filterModal || !filtersUrl || !this.#initialize(filterButton, 'filters')) {
            return;
        }
        filterButton.setAttribute('href', filtersUrl);
        filterButton.removeAttribute('data-href');
        filterButton.classList.remove('disabled', 'btn-disabled');
        filterButton.removeAttribute('aria-disabled');
        const footerButtons = [...filterModal.querySelectorAll('#modal-clear-button,#modal-apply-button')];
        const setLoading = (loading) => {
            filterModal.querySelector('.modal-body').setAttribute('aria-busy', String(loading));
            for (const button of footerButtons) {
                button.disabled = loading;
            }
        };
        filterButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const url = sanitizeUrl(filterButton.getAttribute('href'), true);
            if (!url || filterButton.matches('[aria-disabled="true"],[disabled],.disabled')) {
                return;
            }
            this.#filterRequest?.abort();
            const request = new AbortController();
            this.#filterRequest = request;
            const body = filterModal.querySelector('.modal-body');
            const loading = document.createElement('div');
            loading.className = 'flex justify-center p-6';
            const spinner = document.createElement('span');
            spinner.className = 'loading loading-spinner loading-lg';
            spinner.setAttribute('aria-hidden', 'true');
            loading.append(spinner);
            disposeWidgets(body);
            body.replaceChildren(loading);
            setLoading(true);
            try {
                const response = await fetch(url, { signal: request.signal });
                if ((!response.ok && response.status !== 422) || !sanitizeUrl(response.url, true)) {
                    throw new Error('Unable to load EasyAdmin filters.');
                }
                const text = await response.text();
                if (this.#filterRequest !== request) {
                    return;
                }
                body.innerHTML = text;
                initEasyAdminUI(body);
                initOverlays(body);
                this.#createAutoCompleteFields();
                this.#createFilterToggles();
                filterModal.dispatchEvent(new CustomEvent('ea.filters.loaded', { bubbles: true, detail: { body } }));
                if (filterModal.open && !body.contains(document.activeElement)) {
                    body.querySelector('input:not([type="hidden"]),select,button')?.focus({ preventScroll: true });
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            } finally {
                if (this.#filterRequest === request) {
                    setLoading(false);
                }
            }
        });
        const removeFilter = (field) => {
            disposeWidgets(field);
            for (const input of field.closest('form').querySelectorAll('input[name]')) {
                if (input.name.startsWith(`filters[${field.dataset.filterProperty}]`)) {
                    input.remove();
                }
            }
            field.remove();
        };
        document.querySelector('#modal-clear-button')?.addEventListener('click', () => {
            const form = filterModal.querySelector('form');
            if (!form) {
                return;
            }
            for (const field of filterModal.querySelectorAll('.filter-field')) {
                removeFilter(field);
            }
            form.submit();
        });
        document.querySelector('#modal-apply-button')?.addEventListener('click', () => {
            const form = filterModal.querySelector('form');
            if (!form) {
                return;
            }
            for (const checkbox of filterModal.querySelectorAll('.filter-checkbox:not(:checked)')) {
                removeFilter(checkbox.closest('.filter-field'));
            }
            form.submit();
        });
    }

    #createBatchActions() {
        const selectAllCheckbox = document.querySelector('.form-batch-checkbox-all');
        if (null === selectAllCheckbox) {
            return;
        }

        // templates that override the 'batch_actions' block may still hide it with 'd-none';
        // remove it on page load because elements with 'display: none' can't be animated
        document.querySelectorAll('.page-actions-stack .batch-actions.d-none').forEach((batchActions) => {
            batchActions.classList.remove('d-none');
            batchActions.inert = true;
        });

        const rowCheckboxes = document.querySelectorAll('input[type="checkbox"].form-batch-checkbox');
        if (this.#initialize(selectAllCheckbox, 'batch-select-all')) {
            selectAllCheckbox.addEventListener('change', () => {
                document.querySelectorAll('input[type="checkbox"].form-batch-checkbox').forEach((rowCheckbox) => {
                    rowCheckbox.checked = selectAllCheckbox.checked;
                    rowCheckbox.dispatchEvent(new Event('change'));
                });
            });
        }

        const deselectAllButton = document.querySelector('.deselect-batch-button');
        if (this.#initialize(deselectAllButton, 'batch-deselect')) {
            deselectAllButton.addEventListener('click', () => {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.dispatchEvent(new Event('change'));
            });
        }

        rowCheckboxes.forEach((rowCheckbox, rowCheckboxIndex) => {
            rowCheckbox.dataset.rowIndex = rowCheckboxIndex;
            if (!this.#initialize(rowCheckbox, 'batch-row')) {
                return;
            }

            rowCheckbox.addEventListener('click', (e) => {
                if (this.#lastBatchCheckbox && e.shiftKey) {
                    const lastIndex = Number.parseInt(this.#lastBatchCheckbox.dataset.rowIndex, 10);
                    const currentIndex = Number.parseInt(e.target.dataset.rowIndex, 10);
                    const valueToApply = e.target.checked;
                    const lowest = Math.min(lastIndex, currentIndex);
                    const highest = Math.max(lastIndex, currentIndex);

                    document
                        .querySelectorAll('input[type="checkbox"].form-batch-checkbox')
                        .forEach((rowCheckbox2, rowCheckboxIndex2) => {
                            if (lowest <= rowCheckboxIndex2 && rowCheckboxIndex2 <= highest) {
                                rowCheckbox2.checked = valueToApply;
                                rowCheckbox2.dispatchEvent(new Event('change'));
                            }
                        });
                }
                this.#lastBatchCheckbox = e.target;
            });

            rowCheckbox.addEventListener('change', () => {
                const selectedRowCheckboxes = document.querySelectorAll(
                    'input[type="checkbox"].form-batch-checkbox:checked'
                );
                const row = rowCheckbox.closest('[data-id]');
                const content = rowCheckbox.closest('.content');

                if (rowCheckbox.checked) {
                    row.classList.add('selected-row');
                } else {
                    row.classList.remove('selected-row');
                    selectAllCheckbox.checked = false;
                }

                const rowsAreSelected = 0 !== selectedRowCheckboxes.length;
                const pageActionsStack = content.querySelector('.page-actions-stack');
                const filters = content.querySelector('.datagrid-filters');
                const globalActions = content.querySelector('.global-actions');
                const batchActions = content.querySelector('.batch-actions');

                if (null !== pageActionsStack) {
                    pageActionsStack.classList.toggle('rows-are-selected', rowsAreSelected);
                    const defaultActions = pageActionsStack.querySelector('.page-actions-default');
                    if (null !== defaultActions) {
                        defaultActions.inert = rowsAreSelected;
                    }
                    if (null !== batchActions) {
                        batchActions.inert = !rowsAreSelected;
                    }

                    return;
                }

                // templates that override the 'page_actions' block don't define the stack of actions
                if (null !== filters) {
                    toggleVisibilityClasses(filters, rowsAreSelected);
                }
                if (null !== globalActions) {
                    toggleVisibilityClasses(globalActions, rowsAreSelected);
                }
                if (null !== batchActions) {
                    toggleVisibilityClasses(batchActions, !rowsAreSelected);
                }
            });
        });

        const modalTitle = document.querySelector('#batch-action-confirmation-title');
        const modalMessage = document.querySelector('#batch-action-confirmation-message');
        const modalButton = document.querySelector('#modal-batch-action-button');
        this.#batchTitleTemplate ??= modalTitle?.textContent;

        // all batch actions share the modal; a listener added on each opening would also run
        // the actions whose modal was cancelled before
        if (this.#initialize(modalButton, 'batch-confirm')) {
            modalButton.addEventListener('click', () => {
                const batchAction = this.#pendingBatchAction;
                this.#pendingBatchAction = null;
                batchAction?.();
            });
            modalButton.closest('dialog')?.addEventListener('ea.modal.hidden', () => {
                this.#pendingBatchAction = null;
            });
        }

        document.querySelectorAll('[data-action-batch]').forEach((dataActionBatch) => {
            if (!this.#initialize(dataActionBatch, 'batch-action')) {
                return;
            }
            dataActionBatch.addEventListener('click', (event) => {
                event.preventDefault();

                const actionElement = event.currentTarget;
                const selectedItems = document.querySelectorAll('input[type="checkbox"].form-batch-checkbox:checked');

                let submitted = false;
                const submitBatchAction = () => {
                    const actionUrl = sanitizeUrl(actionElement.getAttribute('data-action-url'));
                    if (submitted || !actionUrl) {
                        return;
                    }
                    submitted = true;
                    // prevent double submission of the batch action form
                    actionElement.setAttribute('disabled', 'disabled');

                    const batchFormFields = {
                        batchActionName: actionElement.getAttribute('data-action-name'),
                        entityFqcn: actionElement.getAttribute('data-entity-fqcn'),
                        batchActionUrl: actionElement.getAttribute('data-action-url'),
                        batchActionCsrfToken: actionElement.getAttribute('data-action-csrf-token'),
                    };
                    selectedItems.forEach((item, i) => {
                        batchFormFields[`batchActionEntityIds[${i}]`] = item.value;
                    });

                    const batchForm = document.createElement('form');
                    batchForm.setAttribute('method', 'POST');
                    batchForm.setAttribute('action', actionUrl);
                    for (const fieldName in batchFormFields) {
                        const formField = document.createElement('input');
                        formField.setAttribute('type', 'hidden');
                        formField.setAttribute('name', fieldName);
                        formField.setAttribute('value', batchFormFields[fieldName]);
                        batchForm.appendChild(formField);
                    }

                    document.body.appendChild(batchForm);
                    batchForm.submit();
                };

                if (actionElement.hasAttribute('data-action-batch-no-confirm')) {
                    submitBatchAction();
                } else {
                    const actionName = actionElement.textContent.trim() || actionElement.getAttribute('title');

                    const replacePlaceholders = (template) =>
                        template
                            .replace('%action_name%', actionName)
                            .replace('%num_items%', selectedItems.length.toString());

                    // a custom confirmation message replaces the title and is shown as regular text
                    const customMessage = actionElement.getAttribute('data-batch-action-confirm-message');
                    modalTitle.textContent = replacePlaceholders(this.#batchTitleTemplate);
                    toggleVisibilityClasses(modalTitle, null !== customMessage);
                    if (modalMessage) {
                        modalMessage.textContent = customMessage ? replacePlaceholders(customMessage) : '';
                        toggleVisibilityClasses(modalMessage, null === customMessage);
                    }
                    const dialog = modalButton.closest('dialog');
                    if (
                        dialog &&
                        !dialog.hasAttribute('aria-label') &&
                        ['batch-action-confirmation-title', 'batch-action-confirmation-message'].includes(
                            dialog.getAttribute('aria-labelledby')
                        )
                    ) {
                        dialog.setAttribute(
                            'aria-labelledby',
                            customMessage ? 'batch-action-confirmation-message' : 'batch-action-confirmation-title'
                        );
                    }

                    modalButton.classList.remove(...buttonColorClasses);
                    modalButton.classList.add(
                        confirmationButtonColorClass(actionElement.getAttribute('data-action-variant'))
                    );

                    this.#pendingBatchAction = submitBatchAction;
                }
            });
        });
    }

    #createAutoCompleteFields() {
        const autocomplete = new Autocomplete();
        document.querySelectorAll('[data-ea-widget="ea-autocomplete"]').forEach((autocompleteElement) => {
            autocomplete.create(autocompleteElement);
        });
    }

    #createActionConfirmationModals() {
        const modalTitle = document.querySelector('#action-confirmation-title');
        const modalMessage = document.querySelector('#action-confirmation-message');
        const modalContent = document.querySelector('#action-confirmation-content');
        const modalButton = document.querySelector('#modal-action-confirmation-button');
        this.#actionTitleTemplate ??= modalTitle?.textContent;
        const modalButtonLabel = modalButton?.querySelector('.btn-label') ?? modalButton;
        this.#actionButtonLabel ??= modalButtonLabel?.textContent;

        // all actions share the modal; a listener added on each opening would also run the
        // actions whose modal was cancelled before (e.g. deleting a different entity)
        if (this.#initialize(modalButton, 'action-confirm')) {
            modalButton.addEventListener('click', () => {
                const action = this.#pendingAction;
                this.#pendingAction = null;
                action?.();
            });
            modalButton.closest('dialog')?.addEventListener('ea.modal.hidden', () => {
                this.#pendingAction = null;
            });
        }

        document.querySelectorAll('[data-action-confirmation="true"]').forEach((actionElement) => {
            if (!this.#initialize(actionElement, 'action-confirmation')) {
                return;
            }
            actionElement.addEventListener('click', (event) => {
                event.preventDefault();

                const actionName = actionElement.textContent.trim() || actionElement.getAttribute('title');
                const entityName = actionElement.getAttribute('data-action-entity-name') || '';
                const entityId = actionElement.getAttribute('data-action-entity-id') || '';
                const replacePlaceholders = (template) =>
                    template
                        .replace('%action_name%', actionName)
                        .replace('%entity_name%', entityName)
                        .replace('%entity_id%', entityId);
                const showText = (element, template) => {
                    element.textContent = template ? replacePlaceholders(template) : '';
                    toggleVisibilityClasses(element, !template);
                };

                // a custom confirmation message replaces the title and is shown as regular text
                const customMessage = actionElement.getAttribute('data-action-confirmation-message');
                const title = actionElement.getAttribute('data-action-confirmation-title') ?? this.#actionTitleTemplate;
                showText(modalTitle, customMessage ? null : title);
                if (modalMessage) {
                    showText(modalMessage, customMessage);
                }
                if (modalContent) {
                    showText(modalContent, actionElement.getAttribute('data-action-confirmation-content'));
                }
                const dialog = modalButton.closest('dialog');
                if (
                    dialog &&
                    !dialog.hasAttribute('aria-label') &&
                    ['action-confirmation-title', 'action-confirmation-message'].includes(
                        dialog.getAttribute('aria-labelledby')
                    )
                ) {
                    dialog.setAttribute(
                        'aria-labelledby',
                        customMessage ? 'action-confirmation-message' : 'action-confirmation-title'
                    );
                }

                const customButtonLabel = actionElement.getAttribute('data-action-confirmation-button');
                modalButtonLabel.textContent = customButtonLabel ?? this.#actionButtonLabel;

                modalButton.classList.remove(...buttonColorClasses);
                modalButton.classList.add(
                    confirmationButtonColorClass(actionElement.getAttribute('data-action-variant'))
                );

                this.#pendingAction = () => {
                    // Case 1: POST action with formaction (like DELETE with CSRF token)
                    const formAction = actionElement.getAttribute('formaction');
                    if (formAction) {
                        if (sanitizeUrl(formAction)) {
                            const form = document.querySelector('#action-confirmation-form');
                            form.setAttribute('action', formAction);
                            form.submit();
                        }
                        return;
                    }

                    // associated CRUD save buttons need native validation, events and their original payload
                    const associatedForm = actionElement.form;
                    if (actionElement.type === 'submit' && associatedForm?.matches('.ea-new-form,.ea-edit-form')) {
                        if (!sanitizeUrl(associatedForm.action)) {
                            return;
                        }
                        const submitAfterClose = (event) => {
                            if (
                                event.detail.reason === 'confirm' &&
                                associatedForm.isConnected &&
                                !actionElement.disabled
                            ) {
                                associatedForm.requestSubmit(actionElement);
                            }
                        };
                        dialog.addEventListener('ea.modal.hidden', submitAfterClose, { once: true });
                        closeDialog(dialog, 'confirm');
                        if (dialog.open) {
                            dialog.removeEventListener('ea.modal.hidden', submitAfterClose);
                        }
                        return;
                    }

                    // Case 2: dropdown action rendered as form (data-ea-action-form-id)
                    const actionFormId = actionElement.getAttribute('data-ea-action-form-id');
                    if (actionFormId) {
                        const form = document.getElementById(actionFormId);
                        if (form && sanitizeUrl(form.action)) {
                            form.submit();
                        }
                        return;
                    }

                    // Case 3: standalone button inside a <form> (renderAsForm)
                    const parentForm = actionElement.closest('form');
                    if (parentForm?.hasAttribute('action')) {
                        if (sanitizeUrl(parentForm.action)) {
                            parentForm.submit();
                        }
                        return;
                    }

                    // Case 4: GET action with href
                    const href = actionElement.getAttribute('href');
                    if (href && sanitizeUrl(href)) {
                        window.location.href = href;
                    }
                };
            });
        });
    }

    #createDefaultRowAction() {
        const clickableRows = document.querySelectorAll('[data-default-action-url]');
        if (0 === clickableRows.length) {
            return;
        }

        clickableRows.forEach((row) => {
            row.classList.add('ea-clickable-row');
        });

        const clickTrigger =
            clickableRows[0].closest('[data-default-action-trigger]')?.getAttribute('data-default-action-trigger') ||
            'single';

        const interactiveSelectors = [
            'a',
            'button',
            'input',
            'select',
            'textarea',
            '.form-check',
            '.dropdown',
            '.actions',
            '[data-ea-toggle]',
            '[data-bs-toggle]',
            '.btn',
            '.modal',
        ];

        const isInteractiveElement = (element) => {
            // ancestors are checked too, because clicks on elements with 'pointer-events: none'
            // target their parents
            let current = element;
            while (current && current !== document.body) {
                if (interactiveSelectors.some((selector) => current.matches(selector))) {
                    return true;
                }
                current = current.parentElement;
            }

            return false;
        };

        const navigateToUrl = (url, event) => {
            if (!sanitizeUrl(url)) {
                return;
            }
            // create a temporary link and click it to let Turbo (or other libraries) intercept the navigation
            const link = document.createElement('a');
            link.href = url;

            // middle-click or ctrl/cmd-click opens a new tab, like a real link; target="_blank"
            // is used instead of window.open() because Firefox blocks the latter in middle-click handlers
            if (event && (event.metaKey || event.ctrlKey || 1 === event.button)) {
                link.target = '_blank';
                link.rel = 'noopener';

                // clear the cell/text selection that Firefox creates on ctrl/cmd-click so it
                // doesn't linger highlighted after the new tab opens
                const selection = window.getSelection();
                if (null !== selection) {
                    selection.removeAllRanges();
                }
            }

            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const handleRowActivation = (row, event) => {
            // don't navigate if rows are selected (batch mode)
            if (row.classList.contains('selected-row')) {
                return;
            }

            const url = row.dataset.defaultActionUrl;
            if (url) {
                navigateToUrl(url, event);
            }
        };

        // when the single-click trigger is active, a drag-to-select gesture ends with a `click`
        // event at the release point. Skip navigation in that case so users can highlight and
        // copy text from a cell without being navigated away.
        const userIsSelectingTextInRow = (row) => {
            if ('double' === clickTrigger) {
                return false;
            }

            const selection = window.getSelection();
            if (null === selection || 0 === selection.toString().length || 0 === selection.rangeCount) {
                return false;
            }

            return row.contains(selection.getRangeAt(0).commonAncestorContainer);
        };

        clickableRows.forEach((row) => {
            if (!this.#initialize(row, 'row-action')) {
                return;
            }
            row.addEventListener(clickTrigger === 'double' ? 'dblclick' : 'click', (event) => {
                if (isInteractiveElement(event.target)) {
                    return;
                }

                // a middle-click or ctrl/cmd-click opens a new tab; it's not a text-selection
                // gesture, so skip the selection guard. Firefox selects the clicked table cell
                // on ctrl/cmd-click, which would otherwise be mistaken for a text selection and
                // cancel the navigation.
                const opensNewTab = event.metaKey || event.ctrlKey || 1 === event.button;
                if (!opensNewTab && userIsSelectingTextInRow(row)) {
                    return;
                }

                handleRowActivation(row, event);
            });

            row.addEventListener('auxclick', (event) => {
                if (1 !== event.button) {
                    return;
                }

                if (isInteractiveElement(event.target)) {
                    return;
                }

                event.preventDefault();
                handleRowActivation(row, event);
            });

            row.addEventListener('keydown', (event) => {
                if ('Enter' !== event.key && ' ' !== event.key) {
                    return;
                }

                if (isInteractiveElement(event.target) && event.target !== row) {
                    return;
                }

                event.preventDefault();
                handleRowActivation(row, event);
            });
        });
    }

    #createContentHelp() {
        const help = document.querySelector('[data-ea-content-help]');
        if (null === help) {
            return;
        }
        if (!this.#initialize(help, 'content-help')) {
            return;
        }

        const message = help.querySelector('.content-help-message');
        const expander = help.querySelector('.content-help-expander');
        const isCollapsed = () => 'collapsed' === help.dataset.state;
        const updateExpander = () => {
            if (isCollapsed()) {
                expander.hidden = message.scrollHeight <= message.clientHeight + 1;
            }
        };

        const expand = () => {
            if (!isCollapsed()) {
                return;
            }

            const initialHeight = message.getBoundingClientRect().height;
            const expanderHadFocus = document.activeElement === expander;
            help.dataset.state = 'expanded';
            expander.setAttribute('aria-expanded', 'true');
            expander.hidden = true;
            if (expanderHadFocus) {
                message.focus({ preventScroll: true });
            }

            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            // 'height: auto' can't be transitioned in all browsers, so animate the measured heights
            const finalHeight = message.getBoundingClientRect().height;
            message.animate(
                { blockSize: [`${initialHeight}px`, `${finalHeight}px`], overflow: ['hidden', 'hidden'] },
                { duration: 200, easing: 'ease-out' }
            );
        };

        expander.addEventListener('click', expand);
        // links hidden after the first line can still be focused with the keyboard
        message.addEventListener('focusin', (event) => {
            if (
                event.target !== message &&
                event.target.getBoundingClientRect().top >= message.getBoundingClientRect().bottom
            ) {
                expand();
            }
        });

        updateExpander();
        new ResizeObserver(updateExpander).observe(help);
        document.fonts.ready.then(updateExpander);
    }

    #createFilterToggles() {
        document.querySelectorAll('.filter-checkbox').forEach((filterCheckbox) => {
            if (!this.#initialize(filterCheckbox, 'filter-checkbox')) {
                return;
            }
            filterCheckbox.addEventListener('change', () => {
                const filterToggleLink = filterCheckbox.nextElementSibling;
                const filterExpandedAttribute = filterCheckbox.nextElementSibling.getAttribute('aria-expanded');

                if (
                    (filterCheckbox.checked && 'false' === filterExpandedAttribute) ||
                    (!filterCheckbox.checked && 'true' === filterExpandedAttribute)
                ) {
                    filterToggleLink.click();
                }
            });
        });

        document.querySelectorAll('form[data-ea-filters-form-id]').forEach((form) => {
            if (!this.#initialize(form, 'filter-form')) {
                return;
            }
            // TODO: when using the native datepicker, 'change' isn't fired unless you input the entire date + time information
            form.addEventListener('change', (event) => {
                if (event.target.classList.contains('filter-checkbox')) {
                    return;
                }

                const filterCheckbox = event.target.closest('.filter-field')?.querySelector('.filter-checkbox');
                if (filterCheckbox && !filterCheckbox.checked) {
                    filterCheckbox.checked = true;
                }
            });
        });

        document.querySelectorAll('[data-ea-comparison-id]').forEach((comparisonWidget) => {
            if (!this.#initialize(comparisonWidget, 'filter-comparison')) {
                return;
            }
            comparisonWidget.addEventListener('change', (event) => {
                const comparisonWidget = event.currentTarget;
                const comparisonId = comparisonWidget.dataset.eaComparisonId;

                if (comparisonId === undefined) {
                    return;
                }

                const secondValue = document.querySelector(`[data-ea-value2-of-comparison-id="${comparisonId}"]`);

                if (secondValue === null) {
                    return;
                }

                toggleVisibilityClasses(secondValue, comparisonWidget.value !== 'between');
            });
        });
    }

    #createActionHandlers() {
        document.querySelectorAll('[data-ea-action-form-id]').forEach((element) => {
            if (!this.#initialize(element, 'action-form')) {
                return;
            }
            element.addEventListener('click', (event) => {
                if (element.hasAttribute('data-action-confirmation')) {
                    return;
                }
                event.preventDefault();
                const formId = element.getAttribute('data-ea-action-form-id');
                const form = document.getElementById(formId);
                if (form && sanitizeUrl(form.action)) {
                    form.submit();
                }
            });
        });

        document.querySelectorAll('[data-ea-action-url]').forEach((element) => {
            if (!this.#initialize(element, 'action-url')) {
                return;
            }
            element.addEventListener('click', (event) => {
                if (element.hasAttribute('data-action-confirmation')) {
                    return;
                }
                event.preventDefault();
                const actionUrl = sanitizeUrl(element.getAttribute('data-ea-action-url'));
                if (null !== actionUrl) {
                    window.location = actionUrl;
                }
            });
        });
    }
}
