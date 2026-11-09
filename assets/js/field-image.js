import * as basicLightbox from 'basiclightbox';
import { lockScroll, unlockScroll } from './ui/scroll-lock';

const KEY = Symbol.for('easyadmin.image-viewer');
if (!document[KEY]) {
    const state = { active: null };
    document[KEY] = state;
    // delegate once so thumbnails inserted later keep their ordinary link fallback
    document.addEventListener('click', (event) => {
        const thumbnail = event.target.closest('.ea-lightbox-thumbnail');
        if (
            !thumbnail ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }
        let content;
        try {
            content = document.querySelector(thumbnail.dataset.eaLightboxContentSelector);
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'SyntaxError')) {
                throw error;
            }
            return;
        }
        if (!content) {
            return;
        }
        event.preventDefault();
        state.active?.close();
        const owner = thumbnail.closest('dialog[open]');
        let closed = false;
        const onKeyDown = (keyEvent) => {
            if (keyEvent.defaultPrevented) {
                return;
            }
            if (keyEvent.key === 'Escape') {
                keyEvent.preventDefault();
                keyEvent.stopImmediatePropagation();
                lightbox.close();
            } else if (keyEvent.key === 'Tab') {
                const controls = [
                    ...placeholder.querySelectorAll(
                        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]'
                    ),
                ].filter((control) => control.tabIndex >= 0 && control.getClientRects().length);
                const edge = keyEvent.shiftKey ? controls[0] : controls.at(-1);
                if (!controls.length || document.activeElement === edge || document.activeElement === placeholder) {
                    keyEvent.preventDefault();
                    (keyEvent.shiftKey ? controls.at(-1) : controls[0])?.focus();
                    if (!controls.length) {
                        placeholder.focus();
                    }
                }
            }
        };
        const ownerClosed = () => lightbox.close();
        const lightbox = basicLightbox.create(content.innerHTML, {
            onShow: () => {
                window.addEventListener('keydown', onKeyDown, true);
                owner?.addEventListener('ea.modal.hidden', ownerClosed, { once: true });
            },
            onClose: () => {
                if (closed) {
                    return false;
                }
                closed = true;
                window.removeEventListener('keydown', onKeyDown, true);
                owner?.removeEventListener('ea.modal.hidden', ownerClosed);
                lightbox.element().inert = true;
                lightbox.element().style.pointerEvents = 'none';
                unlockScroll(document, lightbox);
                if (state.active === lightbox) {
                    state.active = null;
                }
                if (thumbnail.isConnected) {
                    thumbnail.focus({ preventScroll: true });
                }
            },
        });
        const placeholder = lightbox.element().querySelector('.basicLightbox__placeholder');
        placeholder.tabIndex = -1;
        placeholder.setAttribute('aria-modal', 'true');
        const label = thumbnail.querySelector('img')?.alt || thumbnail.getAttribute('aria-label');
        if (label) {
            placeholder.setAttribute('aria-label', label);
        }
        state.active = lightbox;
        state.thumbnail = thumbnail;
        lockScroll(document, lightbox);
        lightbox.show();
        if (owner) {
            owner.append(lightbox.element());
        }
        placeholder.focus();
    });
    document.addEventListener('ea.collection.item-removed', () => {
        if (state.active && !state.thumbnail.isConnected) {
            state.active.close();
        }
    });
}
