<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

handleOptions();
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

try {
    initDatabase();
    $pdo = getDB();

    $mesas = $pdo->query('SELECT id, numero, sector, capacidad, tarifa_minima FROM mesas ORDER BY id')->fetchAll();
    $ahora = date('Y-m-d H:i:s');

    $stmtReserva = $pdo->prepare(
        "SELECT mesa_id FROM reservas
         WHERE estado = 'confirmada' AND fecha_hora > ?
         GROUP BY mesa_id"
    );
    $stmtReserva->execute([$ahora]);
    $ocupadas = array_column($stmtReserva->fetchAll(), 'mesa_id');

    $result = [];
    foreach ($mesas as $mesa) {
        $formatted = mesaToArray($mesa);
        $formatted['disponible'] = !in_array($mesa['id'], $ocupadas, true);
        $result[] = $formatted;
    }

    jsonResponse($result);
} catch (PDOException $e) {
    jsonError('Error al obtener las mesas', 500);
}
