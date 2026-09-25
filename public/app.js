// Datos de la carta (fallback si el servidor no está disponible)
const cartaLocal = {
    platos: [
        // Entradas
        { id: 1, nombre: "Bruschetta", precio: 2500, categoria: "Entradas" },
        { id: 2, nombre: "Carpaccio de Res", precio: 3500, categoria: "Entradas" },
        { id: 3, nombre: "Ensalada César", precio: 3000, categoria: "Entradas" },
        { id: 4, nombre: "Provoleta a la Parrilla", precio: 3200, categoria: "Entradas" },
        // Platos Principales
        { id: 5, nombre: "Pasta Carbonara", precio: 4500, categoria: "Platos Principales" },
        { id: 6, nombre: "Risotto de Hongos", precio: 5000, categoria: "Platos Principales" },
        { id: 7, nombre: "Salmón a la Plancha", precio: 6500, categoria: "Platos Principales" },
        { id: 8, nombre: "Bife de Chorizo", precio: 7500, categoria: "Platos Principales" },
        { id: 9, nombre: "Pollo al Vino", precio: 5500, categoria: "Platos Principales" },
        { id: 10, nombre: "Lasagna Casera", precio: 4800, categoria: "Platos Principales" },
        // Postres
        { id: 11, nombre: "Tiramisú", precio: 2800, categoria: "Postres" },
        { id: 12, nombre: "Flan Casero", precio: 2000, categoria: "Postres" },
        { id: 13, nombre: "Brownie con Helado", precio: 3000, categoria: "Postres" },
        { id: 14, nombre: "Cheesecake de Frutos Rojos", precio: 3200, categoria: "Postres" }
    ],
    bebidas: [
        // Sin Alcohol
        { id: 1, nombre: "Agua Mineral", precio: 800, categoria: "Sin Alcohol" },
        { id: 2, nombre: "Agua con Gas", precio: 800, categoria: "Sin Alcohol" },
        { id: 3, nombre: "Coca Cola", precio: 1200, categoria: "Sin Alcohol" },
        { id: 4, nombre: "Sprite", precio: 1200, categoria: "Sin Alcohol" },
        { id: 5, nombre: "Jugo de Naranja Natural", precio: 1500, categoria: "Sin Alcohol" },
        // Vinos
        { id: 6, nombre: "Vino Tinto Reserva", precio: 4500, categoria: "Vinos" },
        { id: 7, nombre: "Vino Blanco", precio: 4000, categoria: "Vinos" },
        { id: 8, nombre: "Vino Rosado", precio: 4200, categoria: "Vinos" },
        { id: 9, nombre: "Malbec Premium", precio: 5500, categoria: "Vinos" },
        // Cervezas
        { id: 10, nombre: "Cerveza Artesanal IPA", precio: 1800, categoria: "Cervezas" },
        { id: 11, nombre: "Cerveza Artesanal Lager", precio: 1800, categoria: "Cervezas" },
        { id: 12, nombre: "Cerveza Artesanal Stout", precio: 2000, categoria: "Cervezas" },
        // Espumantes
        { id: 13, nombre: "Champagne", precio: 8500, categoria: "Espumantes" },
        { id: 14, nombre: "Espumante Nacional", precio: 4500, categoria: "Espumantes" },
        { id: 15, nombre: "Prosecco", precio: 6000, categoria: "Espumantes" }
    ]
};

// Cargar carta al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await cargarCarta();
    configurarNavegacion();
});

// Configurar navegación según si hay usuario logueado
function configurarNavegacion() {
    const user = API.getCurrentUser();
    const navSection = document.getElementById('nav-user-section');
    
    if (user) {
        // Usuario logueado
        if (user.rol === 'admin') {
            navSection.innerHTML = `
                <span style="color: white; padding: 0.5rem 1rem;">Hola, ${user.nombre}</span>
                <a href="admin.html">Panel Admin</a>
                <button onclick="cerrarSesion()" class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-left: 0.5rem;">Cerrar Sesión</button>
            `;
        } else {
            navSection.innerHTML = `
                <span style="color: white; padding: 0.5rem 1rem;">Hola, ${user.nombre}</span>
                <a href="dashboard.html">Mis Reservas</a>
                <button onclick="cerrarSesion()" class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-left: 0.5rem;">Cerrar Sesión</button>
            `;
        }
    } else {
        // Usuario no logueado
        navSection.innerHTML = '<a href="login.html">Iniciar Sesión</a>';
    }
}

function cerrarSesion() {
    API.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

async function cargarCarta() {
    const platosContainer = document.getElementById('platos-container');
    const bebidasContainer = document.getElementById('bebidas-container');

    // Mostrar mensaje de carga
    platosContainer.innerHTML = '<p>Cargando platos...</p>';
    bebidasContainer.innerHTML = '<p>Cargando bebidas...</p>';

    try {
        const carta = await API.getCarta();
        mostrarCarta(carta, platosContainer, bebidasContainer);
    } catch (error) {
        console.error('Error al cargar la carta:', error);
        mostrarCarta(cartaLocal, platosContainer, bebidasContainer);
    }
}

function mostrarCarta(carta, platosContainer, bebidasContainer) {
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
                const card = crearItemCard(plato);
                itemsGrid.appendChild(card);
            });
            
            categoriaDiv.appendChild(itemsGrid);
            platosContainer.appendChild(categoriaDiv);
        }
    });

    if (carta.platos.length === 0) {
        platosContainer.innerHTML = '<p>No hay platos disponibles en este momento.</p>';
    }

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
                const card = crearItemCard(bebida);
                itemsGrid.appendChild(card);
            });
            
            categoriaDiv.appendChild(itemsGrid);
            bebidasContainer.appendChild(categoriaDiv);
        }
    });

    if (carta.bebidas.length === 0) {
        bebidasContainer.innerHTML = '<p>No hay bebidas disponibles en este momento.</p>';
    }
}

function crearItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
        <h4>${item.nombre}</h4>
        <div class="precio">$${item.precio.toLocaleString()}</div>
    `;
    return card;
}

