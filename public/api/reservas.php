<?php
require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../app/db.php';
require_once __DIR__ . '/../app/reservas.php';

handleOptions();
$user = requireAuth();

try {
    $pdo = getDB();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // alias para no pisar r.tarifa_minima (lo que se cobró al reservar)
        $stmt = $pdo->prepare(
            'SELECT r.*, m.numero, m.sector, m.capacidad, m.tarifa_minima AS mesa_tarifa_minima
             FROM reservas r
             JOIN mesas m ON m.id = r.mesa_id
             WHERE r.usuario_id = ?
             ORDER BY r.fecha_hora DESC'
        );
        $stmt->execute([$user['id']]);
        $reservas = $stmt->fetchAll();

        $result = array_map(function (array $r) {
            return [
                'id' => (int) $r['id'],
                'usuarioId' => (int) $r['usuario_id'],
                'mesaId' => (int) $r['mesa_id'],
                'fechaHora' => date('c', strtotime($r['fecha_hora'])),
                'cantidadPersonas' => (int) $r['cantidad_personas'],
                'tarifaMinima' => (float) $r['tarifa_minima'],
                'estado' => $r['estado'],
                'fechaCreacion' => date('c', strtotime($r['fecha_creacion'])),
                'fechaCancelacion' => $r['fecha_cancelacion'] !== null
                    ? date('c', strtotime($r['fecha_cancelacion']))
                    : null,
                'reembolso' => $r['reembolso'] !== null ? (float) $r['reembolso'] : null,
                'porcentajeReembolso' => $r['porcentaje_reembolso'] !== null
                    ? (int) $r['porcentaje_reembolso']
                    : null,
                'mesa' => [
                    'id' => (int) $r['mesa_id'],
                    'numero' => (int) $r['numero'],
                    'sector' => $r['sector'],
                    'capacidad' => (int) $r['capacidad'],
                    'tarifaMinima' => (float) $r['mesa_tarifa_minima'],
                ],
            ];
        }, $reservas);

        jsonResponse($result);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = getJsonBody();
        $mesaId = (int) ($body['mesaId'] ?? 0);
        $fechaHora = $body['fechaHora'] ?? '';
        $cantidadPersonas = (int) ($body['cantidadPersonas'] ?? 0);

        if ($mesaId <= 0 || $fechaHora === '' || $cantidadPersonas <= 0) {
            jsonError('Datos de reserva incompletos');
        }

        $timestamp = parsearFechaReserva($fechaHora);
        $fechaMysql = date('Y-m-d H:i:s', $timestamp);

        $pdo->beginTransaction();
        try {
            $mesa = validarReservaMesa($pdo, $mesaId, $timestamp, $cantidadPersonas);

            $insert = $pdo->prepare(
                'INSERT INTO reservas (usuario_id, mesa_id, fecha_hora, cantidad_personas, tarifa_minima, estado)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $insert->execute([
                $user['id'],
                $mesaId,
                $fechaMysql,
                $cantidadPersonas,
                $mesa['tarifa_minima'],
                'confirmada',
            ]);
            $reservaId = (int) $pdo->lastInsertId();

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            if ($e instanceof ReservaException) {
                jsonError($e->getMessage(), $e->getCode());
            }
            throw $e;
        }

        jsonResponse([
            'id' => $reservaId,
            'usuarioId' => (int) $user['id'],
            'mesaId' => $mesaId,
            'fechaHora' => date('c', $timestamp),
            'cantidadPersonas' => $cantidadPersonas,
            'tarifaMinima' => (float) $mesa['tarifa_minima'],
            'estado' => 'confirmada',
            'fechaCreacion' => date('c'),
            'mesa' => mesaToArray($mesa),
        ]);
    }

    jsonError('Método no permitido', 405);
} catch (PDOException $e) {
    jsonError('Error al procesar la reserva', 500);
}
