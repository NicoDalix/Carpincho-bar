<?php
require_once __DIR__ . '/../../app/helpers.php';
require_once __DIR__ . '/../../app/db.php';
require_once __DIR__ . '/../../app/security.php';
require_once __DIR__ . '/../../app/reservas.php';

handleOptions();
requireAdmin();

try {
    $pdo = getDB();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // La tarifa de la mesa va con alias para no pisar r.tarifa_minima
        // (la tarifa que se cobró al momento de reservar).
        $select = "SELECT r.*, m.numero, m.sector, m.capacidad, m.tarifa_minima AS mesa_tarifa_minima,
                          u.nombre AS usuario_nombre, u.email AS usuario_email
                   FROM reservas r
                   JOIN mesas m ON m.id = r.mesa_id
                   JOIN usuarios u ON u.id = r.usuario_id";

        if (isset($_GET['nombre'])) {
            $nombre = trim($_GET['nombre']);
            if ($nombre === '') {
                jsonError('Debe proporcionar un nombre para buscar');
            }

            $stmt = $pdo->prepare("$select WHERE u.nombre LIKE ? ORDER BY r.fecha_hora DESC");
            $stmt->execute(['%' . $nombre . '%']);
        } else {
            $stmt = $pdo->query("$select ORDER BY r.fecha_hora DESC");
        }

        $reservas = $stmt->fetchAll();
        $result = array_map('formatReservaAdmin', $reservas);
        jsonResponse($result);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = getJsonBody();
        $mesaId = (int) ($body['mesaId'] ?? 0);
        $fechaHora = $body['fechaHora'] ?? '';
        $cantidadPersonas = (int) ($body['cantidadPersonas'] ?? 0);
        $nombreCliente = trim($body['nombreCliente'] ?? '');
        $emailCliente = trim(strtolower($body['emailCliente'] ?? ''));
        $telefono = trim($body['telefono'] ?? '');

        if ($mesaId <= 0 || $fechaHora === '' || $cantidadPersonas <= 0) {
            jsonError('Datos de reserva incompletos');
        }

        $timestamp = parsearFechaReserva($fechaHora);
        $fechaMysql = date('Y-m-d H:i:s', $timestamp);

        // Se valida la mesa ANTES de crear/actualizar el usuario, y todo va en
        // la misma transacción: si la reserva se rechaza no queda un usuario
        // huérfano creado.
        $pdo->beginTransaction();
        try {
            $mesa = validarReservaMesa($pdo, $mesaId, $timestamp, $cantidadPersonas);

            $usuarioId = null;

            if ($emailCliente !== '') {
                $stmtUser = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
                $stmtUser->execute([$emailCliente]);
                $usuario = $stmtUser->fetch();

                if ($usuario) {
                    $usuarioId = (int) $usuario['id'];
                    if ($nombreCliente !== '' || $telefono !== '') {
                        $updateUser = $pdo->prepare(
                            'UPDATE usuarios SET nombre = COALESCE(NULLIF(?, ""), nombre),
                             telefono = COALESCE(NULLIF(?, ""), telefono) WHERE id = ?'
                        );
                        $updateUser->execute([$nombreCliente, $telefono, $usuarioId]);
                    }
                } else {
                    $tempPassword = hashPassword(bin2hex(random_bytes(8)));
                    $insertUser = $pdo->prepare(
                        'INSERT INTO usuarios (email, password, nombre, telefono, rol) VALUES (?, ?, ?, ?, ?)'
                    );
                    $insertUser->execute([
                        $emailCliente,
                        $tempPassword,
                        $nombreCliente !== '' ? $nombreCliente : 'Cliente',
                        $telefono !== '' ? $telefono : null,
                        'usuario',
                    ]);
                    $usuarioId = (int) $pdo->lastInsertId();
                }
            } else {
                $tempEmail = 'temp_' . time() . '@temp.com';
                $tempPassword = hashPassword(bin2hex(random_bytes(8)));
                $insertUser = $pdo->prepare(
                    'INSERT INTO usuarios (email, password, nombre, telefono, rol) VALUES (?, ?, ?, ?, ?)'
                );
                $insertUser->execute([
                    $tempEmail,
                    $tempPassword,
                    $nombreCliente !== '' ? $nombreCliente : 'Cliente',
                    $telefono !== '' ? $telefono : null,
                    'usuario',
                ]);
                $usuarioId = (int) $pdo->lastInsertId();
            }

            $insert = $pdo->prepare(
                'INSERT INTO reservas (usuario_id, mesa_id, fecha_hora, cantidad_personas, tarifa_minima,
                 estado, creada_por_admin, nombre_cliente, telefono)
                 VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
            );
            $insert->execute([
                $usuarioId,
                $mesaId,
                $fechaMysql,
                $cantidadPersonas,
                $mesa['tarifa_minima'],
                'confirmada',
                $nombreCliente !== '' ? $nombreCliente : null,
                $telefono !== '' ? $telefono : null,
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
            'usuarioId' => $usuarioId,
            'mesaId' => $mesaId,
            'fechaHora' => date('c', $timestamp),
            'cantidadPersonas' => $cantidadPersonas,
            'tarifaMinima' => (float) $mesa['tarifa_minima'],
            'estado' => 'confirmada',
            'creadaPorAdmin' => true,
            'nombreCliente' => $nombreCliente,
            'telefono' => $telefono,
            'mesa' => mesaToArray($mesa),
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $reservaId = (int) ($_GET['id'] ?? 0);
        if ($reservaId <= 0) {
            jsonError('ID de reserva inválido');
        }

        $stmt = $pdo->prepare('SELECT * FROM reservas WHERE id = ? LIMIT 1');
        $stmt->execute([$reservaId]);
        $reserva = $stmt->fetch();

        if (!$reserva) {
            jsonError('Reserva no encontrada', 404);
        }

        $delete = $pdo->prepare('DELETE FROM reservas WHERE id = ?');
        $delete->execute([$reservaId]);

        jsonResponse([
            'mensaje' => 'Reserva eliminada exitosamente',
            'reserva' => formatReservaAdmin($reserva),
        ]);
    }

    jsonError('Método no permitido', 405);
} catch (PDOException $e) {
    jsonError('Error al procesar reservas de administrador', 500);
}

function formatReservaAdmin(array $r): array
{
    return [
        'id' => (int) $r['id'],
        'usuarioId' => (int) $r['usuario_id'],
        'mesaId' => (int) $r['mesa_id'],
        'fechaHora' => date('c', strtotime($r['fecha_hora'])),
        'cantidadPersonas' => (int) $r['cantidad_personas'],
        'tarifaMinima' => (float) $r['tarifa_minima'],
        'estado' => $r['estado'],
        'fechaCreacion' => date('c', strtotime($r['fecha_creacion'])),
        'reembolso' => $r['reembolso'] !== null ? (float) $r['reembolso'] : null,
        'porcentajeReembolso' => $r['porcentaje_reembolso'] !== null ? (int) $r['porcentaje_reembolso'] : null,
        'creadaPorAdmin' => (bool) ($r['creada_por_admin'] ?? false),
        'nombreCliente' => $r['nombre_cliente'],
        'telefono' => $r['telefono'],
        'mesa' => isset($r['numero']) ? [
            'id' => (int) $r['mesa_id'],
            'numero' => (int) $r['numero'],
            'sector' => $r['sector'],
            'capacidad' => (int) $r['capacidad'],
            'tarifaMinima' => (float) $r['mesa_tarifa_minima'],
        ] : null,
        'usuario' => isset($r['usuario_nombre']) ? [
            'nombre' => $r['usuario_nombre'],
            'email' => $r['usuario_email'],
        ] : null,
    ];
}
