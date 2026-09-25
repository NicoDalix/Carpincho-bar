/**
 * Utilidades de interfaz compartidas (UX/UI)
 */
const UI = {
    toastContainer: null,

    init() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            this.toastContainer.setAttribute('aria-live', 'polite');
            this.toastContainer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.toastContainer);
        }
        this.initMobileNav();
    },

    toast(message, type = 'info', duration = 4500) {
        this.init();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${this._icon(type)}</span>
            <span class="toast-text">${message}</span>
            <button class="toast-close" aria-label="Cerrar notificación">
                <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>
                </svg>
            </button>
        `;

        const close = () => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-close').addEventListener('click', close);
        this.toastContainer.appendChild(toast);
        setTimeout(close, duration);
    },

    success(msg) { this.toast(msg, 'success'); },
    error(msg) { this.toast(msg, 'error', 6000); },
    info(msg) { this.toast(msg, 'info'); },

    _icon(type) {
        const shapes = {
            success: '<circle cx="12" cy="12" r="9.25"/><path d="m8 12.25 2.75 2.75 5.25-6"/>',
            error: '<circle cx="12" cy="12" r="9.25"/><path d="m9 9 6 6M15 9l-6 6"/>',
            info: '<circle cx="12" cy="12" r="9.25"/><path d="M12 11.25v5"/><path d="M12 7.75v.1"/>',
            warning: '<path d="M12 3.5 2.75 19.5h18.5z"/><path d="M12 10v4.25"/><path d="M12 17.4v.1"/>',
        };

        return `<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">${shapes[type] || shapes.info}</svg>`;
    },

    setLoading(button, loading, loadingText = 'Procesando...') {
        if (!button) return;
        if (loading) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.classList.add('is-loading');
            button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
        } else {
            button.disabled = false;
            button.classList.remove('is-loading');
            button.textContent = button.dataset.originalText || button.textContent;
        }
    },

    emptyState(message, hint = '') {
        return `
            <div class="empty-state" role="status">
                <div class="empty-state-icon" aria-hidden="true">
                    <svg class="icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 3.25H7.5A2.25 2.25 0 0 0 5.25 5.5v13a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V8z"/>
                        <path d="M14 3.25V8h4.75"/>
                        <path d="M9 13h6M9 16.25h4"/>
                    </svg>
                </div>
                <p class="empty-state-text">${message}</p>
                ${hint ? `<p class="empty-state-hint">${hint}</p>` : ''}
            </div>
        `;
    },

    loadingSkeleton(count = 3) {
        return Array(count).fill('<div class="skeleton-card"></div>').join('');
    },

    confirm(message, title = 'Confirmar acción') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-dialog" role="alertdialog" aria-labelledby="confirm-title" aria-modal="true">
                    <h3 id="confirm-title">${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-secondary confirm-no">Cancelar</button>
                        <button class="btn btn-primary confirm-yes">Confirmar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('.confirm-yes').focus();

            const close = (result) => {
                overlay.remove();
                resolve(result);
            };

            overlay.querySelector('.confirm-yes').addEventListener('click', () => close(true));
            overlay.querySelector('.confirm-no').addEventListener('click', () => close(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(false);
            });
            document.addEventListener('keydown', function esc(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', esc);
                    close(false);
                }
            });
        });
    },

    initPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(buttonId);
        if (!input || !btn) return;

        btn.addEventListener('click', () => {
            const visible = input.type === 'text';
            input.type = visible ? 'password' : 'text';
            btn.textContent = visible ? 'Mostrar' : 'Ocultar';
            btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        });
    },

    initMobileNav() {
        const header = document.querySelector('header .container');
        const nav = document.querySelector('header nav');
        if (!header || !nav || header.querySelector('.nav-toggle')) return;

        const toggle = document.createElement('button');
        toggle.className = 'nav-toggle';
        toggle.setAttribute('aria-label', 'Abrir menú de navegación');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span></span><span></span><span></span>';

        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('nav-open');
            toggle.setAttribute('aria-expanded', open);
            toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú de navegación');
        });

        header.appendChild(toggle);
    },

    initModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });
    },

    formatMoney(amount) {
        return `$${Number(amount).toLocaleString('es-AR')}`;
    },
};

document.addEventListener('DOMContentLoaded', () => UI.init());
