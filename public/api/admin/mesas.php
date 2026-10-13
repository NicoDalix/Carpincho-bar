<?php
require_once __DIR__ . '/../../app/helpers.php';
require_once __DIR__ . '/../../app/db.php';
require_once __DIR__ . '/../../app/reservas.php';

handleOptions();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

try {
    $pdo = getDB();

    $mesas = $pdo->query('SELECT id, numero, sector, capacidad, tarifa_minima FROM mesas ORDER BY id')->fetchAll();

    // Disponibilidad para el horario que el admin eligió en el formulario
    // (mismo criterio que la vista del cliente). Sin fecha, se usa "ahora".
    $timestamp = parsearFechaReserva($_GET['fechaHora'] ?? date('Y-m-d\TH:i:s'));

    $reservasPorMesa = [];
    foreach (reservasSolapadas($pdo, $timestamp) as $r) {
        $mesaId = (int) $r['mesa_id'];
        if (isset($reservasPorMesa[$mesaId])) {
            continue;
        }
        $reservasPorMesa[$mesaId] = [
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
        $activa = $reservasPorMesa[(int) $mesa['id']] ?? null;
        $formatted['disponible'] = $activa === null;
        $formatted['reservaActiva'] = $activa;
        $result[] = $formatted;
    }

    jsonResponse($result);
} catch (PDOException $e) {
    jsonError('Error al obtener las mesas', 500);
}
