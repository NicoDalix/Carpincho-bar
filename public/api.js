// API del backend PHP + MySQL
const API_BASE = '../api';
 
function getToken() {
    return localStorage.getItem('token');
}
 
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
 
async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {}),
        },
    });
 
    const data = await response.json().catch(() => ({}));
 
    if (!response.ok) {
        throw { error: data.error || 'Error en la solicitud', status: response.status };
    }
 
    return data;
}
 
const API = {
    getCarta: () => apiRequest('/carta.php'),
 
    login: (email, password) =>
        apiRequest('/login.php', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),
 
    register: (nombre, email, password) =>
        apiRequest('/register.php', {
            method: 'POST',
            body: JSON.stringify({ nombre, email, password }),
        }),
 
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },
 
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
 
    getMesas: (fechaHora) =>
        apiRequest(`/mesas.php${fechaHora ? `?fechaHora=${encodeURIComponent(fechaHora)}` : ''}`),
 
    createReserva: (mesaId, fechaHora, cantidadPersonas) =>
        apiRequest('/reservas.php', {
            method: 'POST',
            body: JSON.stringify({ mesaId, fechaHora, cantidadPersonas }),
        }),
 
    getReservas: () => apiRequest('/reservas.php'),
 
    cancelReserva: (reservaId) =>
        apiRequest(`/reservas_cancelar.php?id=${reservaId}`, { method: 'POST' }),
 
    adminGetReservas: () => apiRequest('/admin/reservas.php'),
 
    adminBuscarReservas: (nombre) =>
        apiRequest(`/admin/reservas.php?nombre=${encodeURIComponent(nombre)}`),
 
    adminCreateReserva: (mesaId, fechaHora, cantidadPersonas, nombreCliente, emailCliente, telefono) =>
        apiRequest('/admin/reservas.php', {
            method: 'POST',
            body: JSON.stringify({
                mesaId,
                fechaHora,
                cantidadPersonas,
                nombreCliente,
                emailCliente,
                telefono,
            }),
        }),
 
    adminDeleteReserva: (reservaId) =>
        apiRequest(`/admin/reservas.php?id=${reservaId}`, { method: 'DELETE' }),
 
    adminAddCartaItem: (tipo, nombre, precio, categoria) =>
        apiRequest('/admin/carta.php', {
            method: 'POST',
            body: JSON.stringify({ tipo, nombre, precio, categoria }),
        }),
 
    adminDeleteCartaItem: (tipo, id) =>
        apiRequest(`/admin/carta.php?tipo=${tipo}&id=${id}`, { method: 'DELETE' }),
 
    adminGetMesas: () => apiRequest('/admin/mesas.php'),
};