/**
 * Validación de contraseña (cliente)
 * Mínimo 8 caracteres, al menos una letra y un número
 */
const PasswordValidator = {
    MIN_LENGTH: 8,

    validate(password) {
        if (password.length < this.MIN_LENGTH) {
            return {
                valid: false,
                error: 'La contraseña debe tener al menos 8 caracteres.',
            };
        }

        if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password)) {
            return {
                valid: false,
                error: 'La contraseña debe incluir al menos una letra.',
            };
        }

        if (!/[0-9]/.test(password)) {
            return {
                valid: false,
                error: 'La contraseña debe incluir al menos un número.',
            };
        }

        return { valid: true };
    },

    getRequirements() {
        return [
            { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= this.MIN_LENGTH },
            { id: 'letter', label: 'Al menos una letra', test: (p) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(p) },
            { id: 'number', label: 'Al menos un número', test: (p) => /[0-9]/.test(p) },
        ];
    },

    updateRequirementsUI(password, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.getRequirements().forEach((req) => {
            const item = container.querySelector(`[data-req="${req.id}"]`);
            if (item) {
                item.classList.toggle('valid', req.test(password));
            }
        });
    },
};
