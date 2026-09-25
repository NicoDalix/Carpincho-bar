<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

handleOptions();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido', 405);
}

$reservaId = (int) ($_GET['id'] ?? 0);
if ($reservaId <= 0) {
    jsonError('ID de reserva inválido');
}

try {
    initDatabase();
    $pdo = getDB();

    $stmt = $pdo->prepare(
        'SELECT * FROM reservas WHERE id = ? AND usuario_id = ? LIMIT 1'
    );
    $stmt->execute([$reservaId, $user['id']]);
    $reserva = $stmt->fetch();

    if (!$reserva) {
        jsonError('Reserva no encontrada', 404);
    }

    if ($reserva['estado'] === 'cancelada') {
        jsonError('La reserva ya está cancelada');
    }

    $ahora = time();
    $fechaReserva = strtotime($reserva['fecha_hora']);
    $horasAntes = ($fechaReserva - $ahora) / 3600;

    $reembolso = 0;
    $porcentajeReembolso = 0;

    if ($horasAntes > 12) {
        $reembolso = (float) $reserva['tarifa_minima'];
        $porcentajeReembolso = 100;
    } elseif ($horasAntes > 4) {
        $reembolso = (float) $reserva['tarifa_minima'] * 0.5;
        $porcentajeReembolso = 50;
    }

    $update = $pdo->prepare(
        "UPDATE reservas SET estado = 'cancelada', fecha_cancelacion = NOW(),
         reembolso = ?, porcentaje_reembolso = ? WHERE id = ?"
    );
    $update->execute([$reembolso, $porcentajeReembolso, $reservaId]);

    jsonResponse([
        'mensaje' => 'Reserva cancelada',
        'reembolso' => $reembolso,
        'porcentajeReembolso' => $porcentajeReembolso,
    ]);
} catch (PDOException $e) {
    jsonError('Error al cancelar la reserva', 500);
}
