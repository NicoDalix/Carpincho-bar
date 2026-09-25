let mesas = [];
let mesaSeleccionada = null;
let user = API.getCurrentUser();

// Verificar autenticación
if (!user) {
    window.location.href = 'login.html';
}

// Configurar usuario
if (user.nombre) {
    document.getElementById('user-name').textContent = `Hola, ${user.nombre}`;
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    API.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// Tabs del dashboard
document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
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

// Cargar mesas
async function cargarMesas() {
    try {
        mesas = await API.getMesas();
        renderizarMesas();
    } catch (error) {
        console.error('Error al cargar mesas:', error);
    }
}

function renderizarMesas() {
    const sectores = {
        'interior': document.getElementById('interior-mesas'),
        'exclusivo': document.getElementById('exclusivo-mesas'),
        'patio': document.getElementById('patio-mesas')
    };

    Object.keys(sectores).forEach(sector => {
        sectores[sector].innerHTML = '';
        
        const mesasSector = mesas.filter(m => m.sector === sector);
        mesasSector.forEach(mesa => {
            const card = crearMesaCard(mesa);
            sectores[sector].appendChild(card);
        });
    });
}

function crearMesaCard(mesa) {
    const card = document.createElement('div');
    card.className = `mesa-card ${mesa.disponible ? 'disponible' : 'ocupada'}`;
    card.dataset.mesaId = mesa.id;
    
    if (mesa.disponible) {
        card.addEventListener('click', () => seleccionarMesa(mesa));
    }
    
    card.innerHTML = `
        <div class="mesa-numero">Mesa ${mesa.numero}</div>
        <div class="mesa-capacidad">${mesa.capacidad} personas</div>
        <div class="mesa-tarifa">Min: $${mesa.tarifaMinima.toLocaleString()}</div>
    `;
    
    return card;
}

function seleccionarMesa(mesa) {
    // Remover selección anterior
    document.querySelectorAll('.mesa-card').forEach(c => {
        c.classList.remove('seleccionada');
    });
    
    // Seleccionar nueva mesa
    const card = document.querySelector(`[data-mesa-id="${mesa.id}"]`);
    card.classList.add('seleccionada');
    mesaSeleccionada = mesa;
    
    // Mostrar modal de confirmación
    mostrarModalReserva(mesa);
}

function mostrarModalReserva(mesa) {
    const fechaHora = document.getElementById('fecha-reserva').value;
    const cantidadPersonas = document.getElementById('cantidad-personas').value;
    
    if (!fechaHora || !cantidadPersonas) {
        alert('Por favor completa la fecha, hora y cantidad de personas');
        return;
    }
    
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
        <p><strong>Cantidad de Personas:</strong> ${cantidadPersonas}</p>
        <p><strong>Capacidad de la Mesa:</strong> ${mesa.capacidad} personas</p>
        <p><strong>Tarifa Mínima:</strong> $${mesa.tarifaMinima.toLocaleString()}</p>
    `;
    
    modal.classList.add('show');
}

// Cerrar modal
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('modal-reserva').classList.remove('show');
    mesaSeleccionada = null;
    document.querySelectorAll('.mesa-card').forEach(c => {
        c.classList.remove('seleccionada');
    });
});

document.getElementById('cancelar-reserva-btn').addEventListener('click', () => {
    document.getElementById('modal-reserva').classList.remove('show');
    mesaSeleccionada = null;
    document.querySelectorAll('.mesa-card').forEach(c => {
        c.classList.remove('seleccionada');
    });
});

// Confirmar reserva
document.getElementById('confirmar-reserva-btn').addEventListener('click', async () => {
    if (!mesaSeleccionada) return;
    
    const fechaHora = document.getElementById('fecha-reserva').value;
    const cantidadPersonas = parseInt(document.getElementById('cantidad-personas').value);
    
    if (cantidadPersonas > mesaSeleccionada.capacidad) {
        alert(`La mesa solo tiene capacidad para ${mesaSeleccionada.capacidad} personas`);
        return;
    }
    
    try {
        const data = await API.createReserva(mesaSeleccionada.id, fechaHora, cantidadPersonas);
        alert('¡Reserva confirmada exitosamente!');
        document.getElementById('modal-reserva').classList.remove('show');
        document.getElementById('reserva-form').reset();
        mesaSeleccionada = null;
        document.querySelectorAll('.mesa-card').forEach(c => {
            c.classList.remove('seleccionada');
        });
        cargarMesas();
    } catch (error) {
        alert(error.error || 'Error al crear la reserva');
    }
});

// Cargar reservas
async function cargarReservas() {
    try {
        const reservas = await API.getReservas();
        renderizarReservas(reservas);
    } catch (error) {
        console.error('Error al cargar reservas:', error);
    }
}

function renderizarReservas(reservas) {
    const container = document.getElementById('reservas-container');
    
    if (reservas.length === 0) {
        container.innerHTML = '<p>No tienes reservas aún.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    reservas.forEach(reserva => {
        const card = crearReservaCard(reserva);
        container.appendChild(card);
    });
}

function crearReservaCard(reserva) {
    const card = document.createElement('div');
    card.className = 'reserva-card';
    
    const fecha = new Date(reserva.fechaHora);
    const ahora = new Date();
    const horasAntes = (fecha - ahora) / (1000 * 60 * 60);
    const puedeCancelar = fecha > ahora && reserva.estado === 'confirmada';
    
    let politicaCancelacion = '';
    if (horasAntes > 12) {
        politicaCancelacion = 'Reembolso completo si cancelas con más de 12 horas de anticipación';
    } else if (horasAntes > 4) {
        politicaCancelacion = 'Reembolso del 50% si cancelas entre 12 y 4 horas antes';
    } else {
        politicaCancelacion = 'Sin reembolso si cancelas con menos de 4 horas de anticipación';
    }
    
    const fechaFormateada = fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const estadoClass = reserva.estado === 'confirmada' ? 'success' : 'cancelada';
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
                <span>$${reserva.tarifaMinima.toLocaleString()}</span>
            </div>
            <div class="reserva-info-item">
                <label>Estado</label>
                <span>${estadoTexto}</span>
            </div>
        </div>
        ${reserva.estado === 'confirmada' ? `
            <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
                <strong>Política de cancelación:</strong> ${politicaCancelacion}
            </p>
        ` : ''}
        ${reserva.reembolso !== undefined ? `
            <p style="font-size: 0.9rem; color: var(--success-color); margin-top: 0.5rem;">
                <strong>Reembolso:</strong> $${reserva.reembolso.toLocaleString()} (${reserva.porcentajeReembolso}%)
            </p>
        ` : ''}
        <div class="reserva-actions">
            ${puedeCancelar ? `
                <button class="btn-cancelar" onclick="cancelarReserva(${reserva.id})">
                    Cancelar Reserva
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Cancelar reserva
window.cancelarReserva = async function(reservaId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
        return;
    }
    
    try {
        const data = await API.cancelReserva(reservaId);
        let mensaje = 'Reserva cancelada. ';
        if (data.reembolso > 0) {
            mensaje += `Se te reembolsará $${data.reembolso.toLocaleString()} (${data.porcentajeReembolso}%).`;
        } else {
            mensaje += 'No hay reembolso disponible según la política de cancelación.';
        }
        alert(mensaje);
        cargarReservas();
        cargarMesas(); // Actualizar disponibilidad de mesas
    } catch (error) {
        alert(error.error || 'Error al cancelar la reserva');
    }
};

// Cargar carta
async function cargarCarta() {
    try {
        const carta = await API.getCarta();
        mostrarCartaEnDashboard(carta);
    } catch (error) {
        console.error('Error al cargar la carta:', error);
    }
}

function mostrarCartaEnDashboard(carta) {
    const platosContainer = document.getElementById('carta-platos-container');
    const bebidasContainer = document.getElementById('carta-bebidas-container');

    platosContainer.innerHTML = '';
    bebidasContainer.innerHTML = '';

    // Organizar platos por categoría
    const categoriasPlatos = {
        'Entradas': carta.platos.filter(p => p.categoria === 'Entradas'),
        'Platos Principales': carta.platos.filter(p => p.categoria === 'Platos Principales'),
        'Postres': carta.platos.filter(p => p.categoria === 'Postres')
    };

    // Mostrar platos por categoría
    Object.keys(categoriasPlatos).forEach(categoria => {
        const items = categoriasPlatos[categoria];
        if (items.length > 0) {
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'subcategoria';
            categoriaDiv.innerHTML = `<h4 class="subcategoria-titulo">${categoria}</h4>`;
            const itemsGrid = document.createElement('div');
            itemsGrid.className = 'items-grid';
            
            items.forEach(plato => {
                const card = crearItemCardCarta(plato);
                itemsGrid.appendChild(card);
            });
            
            categoriaDiv.appendChild(itemsGrid);
            platosContainer.appendChild(categoriaDiv);
        }
    });

    // Organizar bebidas por categoría
    const categoriasBebidas = {
        'Sin Alcohol': carta.bebidas.filter(b => b.categoria === 'Sin Alcohol'),
        'Vinos': carta.bebidas.filter(b => b.categoria === 'Vinos'),
        'Cervezas': carta.bebidas.filter(b => b.categoria === 'Cervezas'),
        'Espumantes': carta.bebidas.filter(b => b.categoria === 'Espumantes')
    };

    // Mostrar bebidas por categoría
    Object.keys(categoriasBebidas).forEach(categoria => {
        const items = categoriasBebidas[categoria];
        if (items.length > 0) {
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'subcategoria';
            categoriaDiv.innerHTML = `<h4 class="subcategoria-titulo">${categoria}</h4>`;
            const itemsGrid = document.createElement('div');
            itemsGrid.className = 'items-grid';
            
            items.forEach(bebida => {
                const card = crearItemCardCarta(bebida);
                itemsGrid.appendChild(card);
            });
            
            categoriaDiv.appendChild(itemsGrid);
            bebidasContainer.appendChild(categoriaDiv);
        }
    });
}

function crearItemCardCarta(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <h4>${item.nombre}</h4>
        <div class="precio">$${item.precio.toLocaleString()}</div>
    `;
    return card;
}

// Cargar mesas al iniciar
cargarMesas();

