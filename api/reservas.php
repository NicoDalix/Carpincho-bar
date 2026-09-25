<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

handleOptions();
$user = requireAuth();

try {
    initDatabase();
    $pdo = getDB();
 
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT r.*, m.numero, m.sector, m.capacidad, m.tarifa_minima
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
                'mesa' => [
                    'id' => (int) $r['mesa_id'],
                    'numero' => (int) $r['numero'],
                    'sector' => $r['sector'],
                    'capacidad' => (int) $r['capacidad'],
                    'tarifaMinima' => (float) $r['tarifa_minima'],
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
 
        $stmtMesa = $pdo->prepare('SELECT * FROM mesas WHERE id = ? LIMIT 1');
        $stmtMesa->execute([$mesaId]);
        $mesa = $stmtMesa->fetch();
 
        if (!$mesa) {
            jsonError('Mesa no encontrada', 404);
        }
 
        // Misma duración que usamos en mesas.php para calcular disponibilidad.
        // Tiene que ser el MISMO valor en los dos archivos, si no, el filtro
        // de mesas.php y esta validación final podrían contradecirse.
        $duracionReservaHoras = 2;
 
        $timestampSolicitado = strtotime($fechaHora);
        if ($timestampSolicitado === false) {
            jsonError('Fecha y hora inválida', 400);
        }
 
        $inicioSolicitado = date('Y-m-d H:i:s', $timestampSolicitado);
        $finSolicitado = date('Y-m-d H:i:s', $timestampSolicitado + $duracionReservaHoras * 3600);
        $fechaMysql = $inicioSolicitado;
 
        // Mismo chequeo de solapamiento que en mesas.php: rechazamos la
        // reserva si su bloque de horario pisa el bloque de otra reserva
        // confirmada que ya existe para esa mesa.
        $stmtExiste = $pdo->prepare(
            "SELECT id FROM reservas
             WHERE mesa_id = ?
               AND estado = 'confirmada'
               AND fecha_hora < ?
               AND DATE_ADD(fecha_hora, INTERVAL ? HOUR) > ?
             LIMIT 1"
        );
        $stmtExiste->execute([$mesaId, $finSolicitado, $duracionReservaHoras, $inicioSolicitado]);
        if ($stmtExiste->fetch()) {
            jsonError('La mesa ya está reservada en ese horario');
        }
 
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
 
        jsonResponse([
            'id' => $reservaId,
            'usuarioId' => (int) $user['id'],
            'mesaId' => $mesaId,
            'fechaHora' => date('c', strtotime($fechaMysql)),
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