<?php
require_once __DIR__ . '/../../includes/helpers.php';
require_once __DIR__ . '/../../includes/db.php';

handleOptions();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

try {
    initDatabase();
    $pdo = getDB();

    $mesas = $pdo->query('SELECT id, numero, sector, capacidad, tarifa_minima FROM mesas ORDER BY id')->fetchAll();
    $ahora = date('Y-m-d H:i:s');

    $stmtReserva = $pdo->prepare(
        "SELECT r.*, u.nombre AS usuario_nombre, u.email AS usuario_email
         FROM reservas r
         JOIN usuarios u ON u.id = r.usuario_id
         WHERE r.estado = 'confirmada' AND r.fecha_hora > ?"
    );
    $stmtReserva->execute([$ahora]);
    $reservasActivas = $stmtReserva->fetchAll();

    $reservasPorMesa = [];
    foreach ($reservasActivas as $r) {
        $reservasPorMesa[$r['mesa_id']] = [
            'id' => (int) $r['id'],
            'fechaHora' => date('c', strtotime($r['fecha_hora'])),
            'usuario' => [
                'nombre' => $r['usuario_nombre'],
                'email' => $r['usuario_email'],
            ],
        ];
    }

    $result = [];
    foreach ($mesas as $mesa) {
        $formatted = mesaToArray($mesa);
        $activa = $reservasPorMesa[$mesa['id']] ?? null;
        $formatted['disponible'] = $activa === null;
        $formatted['reservaActiva'] = $activa;
        $result[] = $formatted;
    }

    jsonResponse($result);
} catch (PDOException $e) {
    jsonError('Error al obtener las mesas', 500);
}
