document.addEventListener('DOMContentLoaded', () => {
    configurarNavegacion();
    cargarYRenderizarCarta(
        document.getElementById('platos-container'),
        document.getElementById('bebidas-container')
    );
});

function configurarNavegacion() {
    const user = API.getCurrentUser();
    const navSection = document.getElementById('nav-user-section');

    if (!user) {
        navSection.innerHTML = '<a href="login.html">Iniciar Sesión</a>';
        return;
    }

    const panel = user.rol === 'admin'
        ? '<a href="admin.html">Panel Admin</a>'
        : '<a href="dashboard.html">Mis Reservas</a>';

    navSection.innerHTML = `
        <span class="nav-saludo">Hola, ${escapeHtml(user.nombre)}</span>
        ${panel}
        <button type="button" class="btn btn-secondary" id="logout-btn">Cerrar Sesión</button>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
        API.logout();
        window.location.reload();
    });
}
