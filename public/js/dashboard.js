let mesas = [];
let mesaSeleccionada = null;
const user = API.getCurrentUser();

if (!user) {
    window.location.replace('login.html');
    throw new Error('Sesión requerida');
}

document.getElementById('user-name').textContent = `Hola, ${user.nombre}`;

document.getElementById('logout-btn').addEventListener('click', () => {
    API.logout();
    window.location.href = 'login.html';
});

document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${tab}-section`).classList.add('active');

        if (tab === 'reservas') {
            cargarReservas();
        } else if (tab === 'carta') {
            cargarCarta();
        } else {
            cargarMesas();
        }
    });
});

let busquedaActual = null;

const fechaBusquedaInput = document.getElementById('fecha-busqueda');
const horaBusquedaInput = document.getElementById('hora-busqueda');
const personasInput = document.getElementById('cantidad-personas');
const busquedaError = document.getElementById('busqueda-error');

function fechaLocalISO(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

fechaBusquedaInput.min = fechaLocalISO(new Date());

function mostrarErrorBusqueda(mensaje) {
    busquedaError.textContent = mensaje;
    busquedaError.classList.add('show');
}

function limpiarErrorBusqueda() {
    busquedaError.textContent = '';
    busquedaError.classList.remove('show');
}

function cerrarModalReserva() {
    document.getElementById('modal-reserva').classList.remove('show');
    mesaSeleccionada = null;
    document.querySelectorAll('.mesa-card').forEach(c => c.classList.remove('seleccionada'));
}

function invalidarResultados() {
    if (!busquedaActual) return;
    busquedaActual = null;
    cerrarModalReserva();
    document.getElementById('resultados-mesas').hidden = true;
    const placeholder = document.getElementById('busqueda-placeholder');
    placeholder.textContent = 'Cambiaste la búsqueda. Tocá "Buscar mesas" para ver la disponibilidad actualizada.';
    placeholder.hidden = false;
}

[fechaBusquedaInput, horaBusquedaInput, personasInput].forEach(input => {
    input.addEventListener('input', () => {
        limpiarErrorBusqueda();
        invalidarResultados();
    });
});

document.getElementById('busqueda-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarErrorBusqueda();

    const dia = fechaBusquedaInput.value;
    const hora = horaBusquedaInput.value;
    const personas = parseInt(personasInput.value, 10);

    if (!dia || !hora) {
        mostrarErrorBusqueda('Elegí el día y la hora de la reserva.');
        return;
    }
    if (!personas || personas < 1) {
        mostrarErrorBusqueda('Indicá cuántas personas van a ser.');
        return;
    }

    const fechaHora = `${dia}T${hora}`;
    if (new Date(fechaHora) < new Date()) {
        mostrarErrorBusqueda('Ese horario ya pasó. Elegí un día y hora futuros.');
        return;
    }

    const btn = document.getElementById('buscar-mesas-btn');
    UI.setLoading(btn, true, 'Buscando...');
    busquedaActual = { fechaHora, personas };
    await cargarMesas();
    UI.setLoading(btn, false);
});

async function cargarMesas() {
    if (!busquedaActual) return;
    const busqueda = busquedaActual;
    try {
        const resultado = await API.getMesas(busqueda.fechaHora);
        if (busquedaActual !== busqueda) return;
        mesas = resultado;
        renderizarMesas();
    } catch (error) {
        console.error('Error al cargar mesas:', error);
        mostrarErrorBusqueda(error.error || 'No se pudo consultar la disponibilidad. Probá de nuevo.');
    }
}

const POLLING_MS = 15000; 

setInterval(() => {
    const seccionMesasActiva = document.getElementById('mesas-section').classList.contains('active');
    const modalAbierto = document.getElementById('modal-reserva').classList.contains('show');
    if (seccionMesasActiva && !modalAbierto) {
        cargarMesas();
    }
}, POLLING_MS);

function renderizarMesas() {
    const { fechaHora, personas } = busquedaActual;
    const sectores = {
        'interior': document.getElementById('interior-mesas'),
        'exclusivo': document.getElementById('exclusivo-mesas'),
        'patio': document.getElementById('patio-mesas')
    };

    const aptas = mesas.filter(m => m.disponible && m.capacidad >= personas);

    Object.keys(sectores).forEach(sector => {
        const contenedor = sectores[sector];
        contenedor.innerHTML = '';

        const mesasSector = aptas.filter(m => m.sector === sector);
        if (mesasSector.length === 0) {
            contenedor.innerHTML = '<p class="sector-sin-mesas">No hay mesas libres en este sector para ese horario.</p>';
            return;
        }
        mesasSector.forEach(mesa => contenedor.appendChild(crearMesaCard(mesa)));
    });

    const fecha = new Date(fechaHora);
    const dia = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const resumen = document.getElementById('resultados-resumen');
    resumen.textContent = aptas.length > 0
        ? `${aptas.length} ${aptas.length === 1 ? 'mesa disponible' : 'mesas disponibles'} para ${personas} ${personas === 1 ? 'persona' : 'personas'} el ${dia} a las ${hora}.`
        : `No hay mesas disponibles para ${personas} ${personas === 1 ? 'persona' : 'personas'} el ${dia} a las ${hora}. Probá con otro horario.`;

    document.getElementById('busqueda-placeholder').hidden = true;
    document.getElementById('resultados-mesas').hidden = false;
}

function crearMesaCard(mesa) {
    const card = document.createElement('div');
    card.className = 'mesa-card disponible';
    card.dataset.mesaId = mesa.id;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-label', `Mesa ${mesa.numero}, ${mesa.capacidad} personas`);
    card.addEventListener('click', () => seleccionarMesa(mesa));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            seleccionarMesa(mesa);
        }
    });

    card.innerHTML = `
        <div class="mesa-numero">Mesa ${mesa.numero}</div>
        <div class="mesa-capacidad">${mesa.capacidad} personas</div>
        <div class="mesa-tarifa">Min: ${UI.formatMoney(mesa.tarifaMinima)}</div>
    `;

    return card;
}

function seleccionarMesa(mesa) {
    document.querySelectorAll('.mesa-card').forEach(c => {
        c.classList.remove('seleccionada');
    });

    const card = document.querySelector(`[data-mesa-id="${mesa.id}"]`);
    card.classList.add('seleccionada');
    mesaSeleccionada = mesa;
    mostrarModalReserva(mesa);
}

function mostrarModalReserva(mesa) {
    const { fechaHora, personas } = busquedaActual;

    const fecha = new Date(fechaHora);
    const fechaFormateada = fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const modal = document.getElementById('modal-reserva');
    const info = document.getElementById('modal-reserva-info');

    info.innerHTML = `
        <p><strong>Mesa:</strong> Mesa ${mesa.numero} - ${mesa.sector.charAt(0).toUpperCase() + mesa.sector.slice(1)}</p>
        <p><strong>Fecha y Hora:</strong> ${fechaFormateada}</p>
        <p><strong>Cantidad de Personas:</strong> ${personas}</p>
        <p><strong>Capacidad de la Mesa:</strong> ${mesa.capacidad} personas</p>
        <p><strong>Tarifa Mínima:</strong> ${UI.formatMoney(mesa.tarifaMinima)}</p>
    `;

    modal.classList.add('show');
}

document.querySelector('.close-modal').addEventListener('click', cerrarModalReserva);
document.getElementById('cancelar-reserva-btn').addEventListener('click', cerrarModalReserva);

document.getElementById('confirmar-reserva-btn').addEventListener('click', async () => {
    if (!mesaSeleccionada || !busquedaActual) return;

    const { fechaHora, personas } = busquedaActual;

    try {
        await API.createReserva(mesaSeleccionada.id, fechaHora, personas);
        UI.success('¡Reserva confirmada! La podés ver en "Mis Reservas".');
        cerrarModalReserva();
        cargarMesas();
    } catch (error) {
        UI.error(error.error || 'Error al crear la reserva');
        cerrarModalReserva();
        cargarMesas();
    }
});

async function cargarReservas() {
    const container = document.getElementById('reservas-container');
    try {
        const reservas = await API.getReservas();
        renderizarReservas(reservas);
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        container.innerHTML = '<p class="mensaje-error-carga">No se pudieron cargar tus reservas. Probá de nuevo.</p>';
    }
}

function renderizarReservas(reservas) {
    const container = document.getElementById('reservas-container');

    if (reservas.length === 0) {
        container.innerHTML = '<p>Todavía no tenés reservas.</p>';
        return;
    }

    container.innerHTML = '';
    reservas.forEach(reserva => container.appendChild(crearReservaCard(reserva)));
}

// misma regla que reservas-cancelar.php
function textoPoliticaCancelacion(horasAntes) {
    if (horasAntes > 12) {
        return 'Reembolso completo si cancelás con más de 12 horas de anticipación';
    }
    if (horasAntes > 4) {
        return 'Reembolso del 50% si cancelás entre 12 y 4 horas antes';
    }
    return 'Sin reembolso si cancelás con menos de 4 horas de anticipación';
}

function crearReservaCard(reserva) {
    const card = document.createElement('article');
    card.className = 'reserva-card';

    const fecha = new Date(reserva.fechaHora);
    const ahora = new Date();
    const horasAntes = (fecha - ahora) / (1000 * 60 * 60);
    const puedeCancelar = fecha > ahora && reserva.estado === 'confirmada';

    const fechaFormateada = fecha.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const estadoTexto = reserva.estado === 'confirmada' ? 'Confirmada' : 'Cancelada';

    card.innerHTML = `
        <h4>Reserva #${reserva.id} - Mesa ${reserva.mesa.numero}</h4>
        <div class="reserva-info">
            <div class="reserva-info-item">
                <label>Sector</label>
                <span>${reserva.mesa.sector.charAt(0).toUpperCase() + reserva.mesa.sector.slice(1)}</span>
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
                <span>${estadoTexto}</span>
            </div>
        </div>
        ${reserva.estado === 'confirmada' ? `
            <p class="reserva-nota">
                <strong>Política de cancelación:</strong> ${textoPoliticaCancelacion(horasAntes)}
            </p>
        ` : ''}
        ${reserva.estado === 'cancelada' && reserva.reembolso != null ? `
            <p class="reserva-nota reserva-nota-reembolso">
                <strong>Reembolso:</strong> ${UI.formatMoney(reserva.reembolso)} (${reserva.porcentajeReembolso}%)
            </p>
        ` : ''}
        <div class="reserva-actions">
            ${puedeCancelar ? '<button type="button" class="btn-cancelar">Cancelar Reserva</button>' : ''}
        </div>
    `;

    if (puedeCancelar) {
        card.querySelector('.btn-cancelar').addEventListener('click', () => cancelarReserva(reserva.id));
    }

    return card;
}

async function cancelarReserva(reservaId) {
    const confirmado = await UI.confirm(
        'Se aplicará la política de reembolso según la anticipación.',
        '¿Cancelar esta reserva?'
    );
    if (!confirmado) return;

    try {
        const data = await API.cancelReserva(reservaId);
        if (data.reembolso > 0) {
            UI.success(`Reserva cancelada. Se te reembolsará ${UI.formatMoney(data.reembolso)} (${data.porcentajeReembolso}%).`);
        } else {
            UI.info('Reserva cancelada. No corresponde reembolso según la política de cancelación.');
        }
        cargarReservas();
        cargarMesas();
    } catch (error) {
        UI.error(error.error || 'Error al cancelar la reserva');
    }
}

function cargarCarta() {
    cargarYRenderizarCarta(
        document.getElementById('carta-platos-container'),
        document.getElementById('carta-bebidas-container')
    );
}
