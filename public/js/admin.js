/**
 * Panel de administración (admin.html): listado, búsqueda, alta y baja de
 * reservas, y gestión de la carta.
 *
 * El control de rol de acá es solo de interfaz: la protección real está en el
 * servidor (requireAdmin() en cada endpoint de api/admin/).
 */

const user = API.getCurrentUser();

if (!user || user.rol !== 'admin') {
    window.location.replace('login.html');
    throw new Error('Acceso denegado');
}

document.getElementById('admin-name').textContent = `Admin: ${user.nombre}`;

document.getElementById('logout-btn').addEventListener('click', () => {
    API.logout();
    window.location.href = 'login.html';
});

// Tabs del admin
document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${tab}-section`).classList.add('active');

        if (tab === 'reservas') {
            cargarTodasReservas();
        } else if (tab === 'crear') {
            cargarMesasParaSelect();
        } else if (tab === 'carta') {
            cargarCartaAdmin();
        }
    });
});

function formatearSector(sector) {
    return sector.charAt(0).toUpperCase() + sector.slice(1);
}

// --- Todas las reservas ---
async function cargarTodasReservas() {
    try {
        const reservas = await API.adminGetReservas();
        renderizarTodasReservas(reservas);
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        document.getElementById('todas-reservas-container').innerHTML =
            '<p class="mensaje-error-carga">Error al cargar las reservas.</p>';
    }
}

function renderizarTodasReservas(reservas) {
    const container = document.getElementById('todas-reservas-container');
    const filtroEstado = document.getElementById('filtro-estado').value;

    const reservasFiltradas = filtroEstado === 'todas'
        ? reservas
        : reservas.filter(r => r.estado === filtroEstado);

    // Más recientes primero
    reservasFiltradas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

    if (reservasFiltradas.length === 0) {
        container.innerHTML = '<p>No hay reservas para mostrar.</p>';
        return;
    }

    container.innerHTML = '';
    reservasFiltradas.forEach(reserva => container.appendChild(crearReservaAdminCard(reserva)));
}

function crearReservaAdminCard(reserva) {
    const card = document.createElement('article');
    card.className = 'reserva-card admin-reserva-card';

    const fechaFormateada = new Date(reserva.fechaHora).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const estadoClass = reserva.estado === 'confirmada' ? 'estado-confirmada' : 'estado-cancelada';
    const estadoTexto = reserva.estado === 'confirmada' ? 'Confirmada' : 'Cancelada';
    const mesaTexto = reserva.mesa
        ? `Mesa ${reserva.mesa.numero} - ${formatearSector(reserva.mesa.sector)}`
        : 'N/A';

    card.innerHTML = `
        <h4>Reserva #${reserva.id}</h4>
        <div class="reserva-info">
            <div class="reserva-info-item">
                <label>Cliente</label>
                <span>${escapeHtml(reserva.usuario ? reserva.usuario.nombre : (reserva.nombreCliente || 'N/A'))}</span>
            </div>
            <div class="reserva-info-item">
                <label>Email</label>
                <span>${escapeHtml(reserva.usuario ? reserva.usuario.email : 'N/A')}</span>
            </div>
            <div class="reserva-info-item">
                <label>Teléfono</label>
                <span>${escapeHtml(reserva.telefono || 'N/A')}</span>
            </div>
            <div class="reserva-info-item">
                <label>Mesa</label>
                <span>${mesaTexto}</span>
            </div>
            <div class="reserva-info-item">
                <label>Fecha y Hora</label>
                <span>${fechaFormateada}</span>
            </div>
            <div class="reserva-info-item">
                <label>Cantidad de Personas</label>
                <span>${reserva.cantidadPersonas}</span>
            </div>
            <div class="reserva-info-item">
                <label>Tarifa Mínima</label>
                <span>${UI.formatMoney(reserva.tarifaMinima)}</span>
            </div>
            <div class="reserva-info-item">
                <label>Estado</label>
                <span class="${estadoClass}">${estadoTexto}</span>
            </div>
            ${reserva.creadaPorAdmin ? '<div class="reserva-info-item"><label>Creada por</label><span>Administrador</span></div>' : ''}
        </div>
        <div class="reserva-actions">
            ${reserva.estado === 'confirmada' ? '<button type="button" class="btn-cancelar">Eliminar Reserva</button>' : ''}
        </div>
    `;

    if (reserva.estado === 'confirmada') {
        card.querySelector('.btn-cancelar').addEventListener('click', () => eliminarReserva(reserva.id));
    }

    return card;
}

async function eliminarReserva(reservaId) {
    const confirmado = await UI.confirm(
        'Esta acción no se puede deshacer.',
        `¿Eliminar la reserva #${reservaId}?`
    );
    if (!confirmado) return;

    try {
        await API.adminDeleteReserva(reservaId);
        UI.success('Reserva eliminada.');
        cargarTodasReservas();
    } catch (error) {
        UI.error(error.error || 'Error al eliminar la reserva');
    }
}

document.getElementById('filtro-estado').addEventListener('change', cargarTodasReservas);
document.getElementById('refrescar-reservas').addEventListener('click', cargarTodasReservas);

// --- Buscar reservas por nombre ---
document.getElementById('buscar-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-buscar').value.trim();
    const container = document.getElementById('resultados-busqueda');

    if (!nombre) {
        UI.error('Ingresá un nombre para buscar.');
        return;
    }

    try {
        const reservas = await API.adminBuscarReservas(nombre);

        if (reservas.length === 0) {
            container.innerHTML = `<p>No se encontraron reservas para "${escapeHtml(nombre)}".</p>`;
            return;
        }

        container.innerHTML = '';
        reservas.forEach(reserva => container.appendChild(crearReservaAdminCard(reserva)));
    } catch (error) {
        console.error('Error al buscar:', error);
        container.innerHTML = '<p class="mensaje-error-carga">Error al buscar reservas.</p>';
    }
});

// --- Crear reserva manualmente ---

// Carga las mesas en el select con la disponibilidad del horario elegido en
// el formulario (sin fecha elegida, el backend usa "ahora").
async function cargarMesasParaSelect() {
    try {
        const fechaHora = document.getElementById('fecha-reserva-admin').value;
        const mesas = await API.adminGetMesas(fechaHora || undefined);
        const select = document.getElementById('mesa-seleccionar-admin');
        const seleccionPrevia = select.value;
        select.innerHTML = '<option value="">Seleccione una mesa</option>';

        mesas.forEach(mesa => {
            const option = document.createElement('option');
            option.value = mesa.id;
            const estado = mesa.disponible ? 'Disponible' : 'Ocupada';
            option.textContent = `Mesa ${mesa.numero} - ${formatearSector(mesa.sector)} (${estado}) - Cap: ${mesa.capacidad} pers.`;
            option.disabled = !mesa.disponible;
            select.appendChild(option);
        });

        // Si la mesa que estaba elegida sigue libre en el nuevo horario, se mantiene
        const previa = select.querySelector(`option[value="${seleccionPrevia}"]`);
        if (previa && !previa.disabled) {
            select.value = seleccionPrevia;
        }
    } catch (error) {
        console.error('Error al cargar mesas:', error);
    }
}

// Al cambiar el horario cambia qué mesas están libres
document.getElementById('fecha-reserva-admin').addEventListener('change', cargarMesasParaSelect);

document.getElementById('crear-reserva-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreCliente = document.getElementById('nombre-cliente').value;
    const emailCliente = document.getElementById('email-cliente').value;
    const telefono = document.getElementById('telefono-cliente').value;
    const fechaHora = document.getElementById('fecha-reserva-admin').value;
    const cantidadPersonas = parseInt(document.getElementById('cantidad-personas-admin').value, 10);
    const mesaId = parseInt(document.getElementById('mesa-seleccionar-admin').value, 10);

    if (!mesaId) {
        UI.error('Seleccioná una mesa.');
        return;
    }

    try {
        await API.adminCreateReserva(mesaId, fechaHora, cantidadPersonas, nombreCliente, emailCliente, telefono);
        UI.success('¡Reserva creada!');
        document.getElementById('crear-reserva-form').reset();
        cargarMesasParaSelect();
        document.querySelector('[data-tab="reservas"]').click();
    } catch (error) {
        UI.error(error.error || 'Error al crear la reserva');
    }
});

// --- Gestionar carta ---
function actualizarCategoriasCartaForm() {
    const tipo = document.getElementById('carta-tipo').value;
    const select = document.getElementById('carta-categoria');
    select.innerHTML = CATEGORIAS_CARTA[tipo]
        .map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)
        .join('');
}

document.getElementById('carta-tipo').addEventListener('change', actualizarCategoriasCartaForm);
actualizarCategoriasCartaForm();

function mostrarMensajeCarta(texto, esError = false) {
    const msg = document.getElementById('carta-form-mensaje');
    msg.textContent = texto;
    msg.className = `carta-form-mensaje show ${esError ? 'error' : 'exito'}`;
    setTimeout(() => msg.classList.remove('show'), 3000);
}

document.getElementById('agregar-carta-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('carta-tipo').value;
    const categoria = document.getElementById('carta-categoria').value;
    const nombre = document.getElementById('carta-nombre').value;
    const precio = parseInt(document.getElementById('carta-precio').value, 10);

    try {
        await API.adminAddCartaItem(tipo, nombre, precio, categoria);
        document.getElementById('carta-nombre').value = '';
        document.getElementById('carta-precio').value = '';
        mostrarMensajeCarta(`"${nombre.trim()}" agregado correctamente`);
        cargarCartaAdmin();
    } catch (error) {
        mostrarMensajeCarta(error.error || 'Error al agregar el ítem', true);
    }
});

// Tarjeta de la carta con botón para eliminar el ítem
function crearItemCartaAdmin(tipo) {
    return (item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'admin-carta-item';

        const card = crearItemCartaCard(item);
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn-eliminar-carta';
        boton.textContent = 'Eliminar';
        boton.addEventListener('click', () => eliminarItemCarta(tipo, item.id, item.nombre));
        card.appendChild(boton);

        wrapper.appendChild(card);
        return wrapper;
    };
}

async function cargarCartaAdmin() {
    const platos = document.getElementById('admin-carta-platos-container');
    const bebidas = document.getElementById('admin-carta-bebidas-container');

    try {
        const carta = await API.getCarta();
        renderizarSeccionCarta(platos, carta.platos, CATEGORIAS_CARTA.plato, crearItemCartaAdmin('plato'));
        renderizarSeccionCarta(bebidas, carta.bebidas, CATEGORIAS_CARTA.bebida, crearItemCartaAdmin('bebida'));
    } catch (error) {
        console.error('Error al cargar la carta:', error);
        platos.innerHTML = '<p class="mensaje-error-carga">Error al cargar la carta.</p>';
    }
}

async function eliminarItemCarta(tipo, id, nombre) {
    const confirmado = await UI.confirm(
        'Dejará de aparecer en la carta pública.',
        `¿Eliminar "${nombre}" del menú?`
    );
    if (!confirmado) return;

    try {
        await API.adminDeleteCartaItem(tipo, id);
        mostrarMensajeCarta(`"${nombre}" eliminado correctamente`);
        cargarCartaAdmin();
    } catch (error) {
        mostrarMensajeCarta(error.error || 'Error al eliminar el ítem', true);
    }
}

// Cargar reservas al iniciar
cargarTodasReservas();
