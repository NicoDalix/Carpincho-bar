const CATEGORIAS_CARTA = {
    plato: ['Entradas', 'Platos Principales', 'Postres'],
    bebida: ['Sin Alcohol', 'Vinos', 'Cervezas', 'Espumantes'],
};

function crearItemCartaCard(item) {
    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
        <h4>${escapeHtml(item.nombre)}</h4>
        <p class="precio">${UI.formatMoney(item.precio)}</p>
    `;
    return card;
}

function renderizarSeccionCarta(container, items, categorias, crearCard = crearItemCartaCard) {
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="carta-vacia-msg">No hay ítems disponibles en esta sección.</p>';
        return;
    }

    const conocidas = new Set(categorias);
    const otros = items.filter(item => !conocidas.has(item.categoria));
    const grupos = categorias.map(categoria => [categoria, items.filter(item => item.categoria === categoria)]);
    if (otros.length > 0) {
        grupos.push(['Otros', otros]);
    }

    grupos.forEach(([categoria, lista]) => {
        if (lista.length === 0) return;

        const grupo = document.createElement('section');
        grupo.className = 'subcategoria';
        grupo.innerHTML = `<h4 class="subcategoria-titulo">${escapeHtml(categoria)}</h4>`;

        const grilla = document.createElement('div');
        grilla.className = 'items-grid';
        lista.forEach(item => grilla.appendChild(crearCard(item)));

        grupo.appendChild(grilla);
        container.appendChild(grupo);
    });
}

/** Dibuja platos y bebidas en sus contenedores. */
function renderizarCarta(carta, platosContainer, bebidasContainer, crearCard) {
    renderizarSeccionCarta(platosContainer, carta.platos, CATEGORIAS_CARTA.plato, crearCard);
    renderizarSeccionCarta(bebidasContainer, carta.bebidas, CATEGORIAS_CARTA.bebida, crearCard);
}

/** Pide la carta a la API y la dibuja; si falla, lo informa en la página. */
async function cargarYRenderizarCarta(platosContainer, bebidasContainer, crearCard) {
    platosContainer.innerHTML = '<p class="carta-vacia-msg">Cargando platos...</p>';
    bebidasContainer.innerHTML = '<p class="carta-vacia-msg">Cargando bebidas...</p>';

    try {
        const carta = await API.getCarta();
        renderizarCarta(carta, platosContainer, bebidasContainer, crearCard);
    } catch (error) {
        console.error('Error al cargar la carta:', error);
        const mensaje = '<p class="carta-vacia-msg">No se pudo cargar la carta. Probá recargar la página.</p>';
        platosContainer.innerHTML = mensaje;
        bebidasContainer.innerHTML = '';
    }
}
