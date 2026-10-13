document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');

        document.querySelectorAll('.error-message').forEach(e => {
            e.classList.remove('show');
            e.textContent = '';
        });
    });
});

UI.initPasswordToggle('login-password', 'toggle-login-password');
UI.initPasswordToggle('register-password', 'toggle-register-password');

const registerPasswordInput = document.getElementById('register-password');
if (registerPasswordInput) {
    registerPasswordInput.addEventListener('input', (e) => {
        PasswordValidator.updateRequirementsUI(e.target.value, 'password-requirements');
    });
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');
    errorDiv.classList.remove('show');

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email) {
        errorDiv.textContent = 'El email es obligatorio.';
        errorDiv.classList.add('show');
        document.getElementById('login-email').focus();
        return;
    }

    if (!password) {
        errorDiv.textContent = 'La contraseña es obligatoria.';
        errorDiv.classList.add('show');
        document.getElementById('login-password').focus();
        return;
    }

    UI.setLoading(submitBtn, true, 'Ingresando...');

    try {
        const data = await API.login(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        UI.success('¡Bienvenido de nuevo!');
        setTimeout(() => {
            window.location.href = data.user.rol === 'admin' ? 'admin.html' : 'dashboard.html';
        }, 600);
    } catch (error) {
        errorDiv.textContent = error.error || 'Error al iniciar sesión';
        errorDiv.classList.add('show');
        UI.error(error.error || 'Credenciales incorrectas');
    } finally {
        UI.setLoading(submitBtn, false);
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('register-error');
    const submitBtn = document.getElementById('register-submit-btn');
    errorDiv.classList.remove('show');

    const nombre = document.getElementById('register-nombre').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (nombre.length < 2) {
        errorDiv.textContent = 'El nombre debe tener al menos 2 caracteres.';
        errorDiv.classList.add('show');
        return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorDiv.textContent = 'Ingresá un email válido.';
        errorDiv.classList.add('show');
        return;
    }

    const passwordCheck = PasswordValidator.validate(password);
    if (!passwordCheck.valid) {
        errorDiv.textContent = passwordCheck.error;
        errorDiv.classList.add('show');
        return;
    }

    UI.setLoading(submitBtn, true, 'Creando cuenta...');

    try {
        const data = await API.register(nombre, email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        UI.success('¡Cuenta creada! Redirigiendo...');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } catch (error) {
        errorDiv.textContent = error.error || 'Error al registrarse';
        errorDiv.classList.add('show');
        UI.error(error.error || 'No se pudo completar el registro');
    } finally {
        UI.setLoading(submitBtn, false);
    }
});
