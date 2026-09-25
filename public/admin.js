let user = API.getCurrentUser();

// Verificar autenticación y rol de admin
if (!user || user.rol !== 'admin') {
    alert('Acceso denegado. Debes ser administrador para acceder a esta página.');
    window.location.href = 'login.html';
    throw new Error('Acceso denegado');
}

// Configurar usuario
if (user.nombre) {
    document.getElementById('admin-name').textContent = `Admin: ${user.nombre}`;
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    API.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

// Cargar todas las reservas
async function cargarTodasReservas() {
    try {
        const reservas = await API.adminGetReservas();
        renderizarTodasReservas(reservas);
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        document.getElementById('todas-reservas-container').innerHTML = 
            '<p style="color: red; padding: 1rem; background: #fee; border-radius: 5px;">Error al cargar las reservas</p>';
    }
}

function renderizarTodasReservas(reservas) {
    const container = document.getElementById('todas-reservas-container');
    const filtroEstado = document.getElementById('filtro-estado').value;
    
    let reservasFiltradas = reservas;
    if (filtroEstado !== 'todas') {
        reservasFiltradas = reservas.filter(r => r.estado === filtroEstado);
    }
    
    // Ordenar por fecha (más recientes primero)
    reservasFiltradas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    
    if (reservasFiltradas.length === 0) {
        container.innerHTML = '<p>No hay reservas para mostrar.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    reservasFiltradas.forEach(reserva => {
        const card = crearReservaAdminCard(reserva);
        container.appendChild(card);
    });
}

function crearReservaAdminCard(reserva) {
    const card = document.createElement('div');
    card.className = 'reserva-card admin-reserva-card';
    
    const fecha = new Date(reserva.fechaHora);
    const fechaFormateada = fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const estadoClass = reserva.estado === 'confirmada' ? 'estado-confirmada' : 'estado-cancelada';
    const estadoTexto = reserva.estado === 'confirmada' ? 'Confirmada' : 'Cancelada';
    
    card.innerHTML = `
        <h4>Reserva #${reserva.id}</h4>
        <div class="reserva-info">
            <div class="reserva-info-item">
                <label>Cliente</label>
                <span>${reserva.usuario ? reserva.usuario.nombre : (reserva.nombreCliente || 'N/A')}</span>
            </div>
            <div class="reserva-info-item">
                <label>Email</label>
                <span>${reserva.usuario ? reserva.usuario.email : 'N/A'}</span>
            </div>
            <div class="reserva-info-item">
                <label>Teléfono</label>
                <span>${reserva.telefono || 'N/A'}</span>
            </div>
            <div class="reserva-info-item">
                <label>Mesa</label>
                <span>Mesa ${reserva.mesa ? reserva.mesa.numero : 'N/A'} - ${reserva.mesa ? reserva.mesa.sector.charAt(0).toUpperCase() + reserva.mesa.sector.slice(1) : 'N/A'}</span>
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
                <span>$${reserva.tarifaMinima.toLocaleString()}</span>
            </div>
            <div class="reserva-info-item">
                <label>Estado</label>
                <span class="${estadoClass}">${estadoTexto}</span>
            </div>
            ${reserva.creadaPorAdmin ? '<div class="reserva-info-item"><label>Creada por</label><span>Administrador</span></div>' : ''}
        </div>
        <div class="reserva-actions">
            ${reserva.estado === 'confirmada' ? `
                <button class="btn-cancelar" onclick="eliminarReserva(${reserva.id})">
                    Eliminar Reserva
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Eliminar reserva
window.eliminarReserva = async function(reservaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const data = await API.adminDeleteReserva(reservaId);
        alert('Reserva eliminada exitosamente');
        cargarTodasReservas();
    } catch (error) {
        alert(error.error || 'Error al eliminar la reserva');
    }
};

// Buscar reservas por nombre
document.getElementById('buscar-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-buscar').value;
    
    if (!nombre) {
        alert('Por favor ingrese un nombre para buscar');
        return;
    }
    
    try {
        const reservas = await API.adminBuscarReservas(nombre);
        const container = document.getElementById('resultados-busqueda');
        
        if (reservas.length === 0) {
            container.innerHTML = `<p>No se encontraron reservas para "${nombre}".</p>`;
            return;
        }
        
        container.innerHTML = '';
        reservas.forEach(reserva => {
            const card = crearReservaAdminCard(reserva);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error al buscar:', error);
        document.getElementById('resultados-busqueda').innerHTML = 
            '<p style="color: red;">Error al buscar reservas.</p>';
    }
});

// Cargar mesas para el select
async function cargarMesasParaSelect() {
    try {
        const mesas = await API.adminGetMesas();
        const select = document.getElementById('mesa-seleccionar-admin');
        select.innerHTML = '<option value="">Seleccione una mesa</option>';
        
        mesas.forEach(mesa => {
            const option = document.createElement('option');
            option.value = mesa.id;
            const estado = mesa.disponible ? 'Disponible' : 'Ocupada';
            option.textContent = `Mesa ${mesa.numero} - ${mesa.sector.charAt(0).toUpperCase() + mesa.sector.slice(1)} (${estado}) - Cap: ${mesa.capacidad} pers.`;
            option.disabled = !mesa.disponible;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar mesas:', error);
    }
}

// Crear reserva manualmente
document.getElementById('crear-reserva-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreCliente = document.getElementById('nombre-cliente').value;
    const emailCliente = document.getElementById('email-cliente').value;
    const telefono = document.getElementById('telefono-cliente').value;
    const fechaHora = document.getElementById('fecha-reserva-admin').value;
    const cantidadPersonas = parseInt(document.getElementById('cantidad-personas-admin').value);
    const mesaId = parseInt(document.getElementById('mesa-seleccionar-admin').value);
    
    if (!mesaId) {
        alert('Por favor seleccione una mesa');
        return;
    }
    
    try {
        const data = await API.adminCreateReserva(mesaId, fechaHora, cantidadPersonas, nombreCliente, emailCliente, telefono);
        alert('¡Reserva creada exitosamente!');
        document.getElementById('crear-reserva-form').reset();
        cargarMesasParaSelect();
        // Cambiar a la pestaña de reservas
        document.querySelector('[data-tab="reservas"]').click();
    } catch (error) {
        alert(error.error || 'Error al crear la reserva');
    }
});

// Filtro de estado
document.getElementById('filtro-estado').addEventListener('change', () => {
    cargarTodasReservas();
});

// Botón refrescar
document.getElementById('refrescar-reservas').addEventListener('click', () => {
    cargarTodasReservas();
});

const CATEGORIAS_CARTA = {
    plato: ['Entradas', 'Platos Principales', 'Postres'],
    bebida: ['Sin Alcohol', 'Vinos', 'Cervezas', 'Espumantes']
};

function actualizarCategoriasCartaForm() {
    const tipo = document.getElementById('carta-tipo').value;
    const select = document.getElementById('carta-categoria');
    select.innerHTML = CATEGORIAS_CARTA[tipo]
        .map(cat => `<option value="${cat}">${cat}</option>`)
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

// Cargar carta en admin
async function cargarCartaAdmin() {
    try {
        const carta = await API.getCarta();
        mostrarCartaEnAdmin(carta);
    } catch (error) {
        console.error('Error al cargar la carta:', error);
    }
}

function renderizarItemsPorCategoria(container, items, categorias, tipo) {
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="carta-vacia-msg">No hay ítems en esta sección.</p>';
        return;
    }

    const categoriasUsadas = new Set(categorias);
    const itemsOtros = items.filter(i => !categoriasUsadas.has(i.categoria));
    const todasCategorias = itemsOtros.length > 0 ? [...categorias, 'Otros'] : categorias;

    todasCategorias.forEach(categoria => {
        const lista = categoria === 'Otros'
            ? itemsOtros
            : items.filter(i => i.categoria === categoria);

        if (lista.length === 0) return;

        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'subcategoria';
        categoriaDiv.innerHTML = `<h4 class="subcategoria-titulo">${categoria}</h4>`;
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'items-grid';

        lista.forEach(item => {
            itemsGrid.appendChild(crearItemCardCarta(item, tipo));
        });

        categoriaDiv.appendChild(itemsGrid);
        container.appendChild(categoriaDiv);
    });
}

function mostrarCartaEnAdmin(carta) {
    renderizarItemsPorCategoria(
        document.getElementById('admin-carta-platos-container'),
        carta.platos || [],
        CATEGORIAS_CARTA.plato,
        'plato'
    );
    renderizarItemsPorCategoria(
        document.getElementById('admin-carta-bebidas-container'),
        carta.bebidas || [],
        CATEGORIAS_CARTA.bebida,
        'bebida'
    );
}

function crearItemCardCarta(item, tipo) {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-carta-item';
    wrapper.innerHTML = `
        <div class="item-card">
            <h4>${item.nombre}</h4>
            <div class="precio">$${item.precio.toLocaleString()}</div>
            <button type="button" class="btn-eliminar-carta" data-tipo="${tipo}" data-id="${item.id}">
                Eliminar
            </button>
        </div>
    `;

    wrapper.querySelector('.btn-eliminar-carta').addEventListener('click', () => {
        eliminarItemCarta(tipo, item.id, item.nombre);
    });

    return wrapper;
}

window.eliminarItemCarta = async function(tipo, id, nombre) {
    if (!confirm(`¿Eliminar "${nombre}" del menú?`)) return;

    try {
        await API.adminDeleteCartaItem(tipo, id);
        mostrarMensajeCarta(`"${nombre}" eliminado correctamente`);
        cargarCartaAdmin();
    } catch (error) {
        mostrarMensajeCarta(error.error || 'Error al eliminar el ítem', true);
    }
};

// Cargar reservas al iniciar
cargarTodasReservas();

