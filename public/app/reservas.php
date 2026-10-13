<?php
require_once __DIR__ . '/helpers.php';

define('DURACION_RESERVA_HORAS', 2);

class ReservaException extends Exception
{
}

/** Convierte la fecha que manda el front en timestamp, o corta con 400. */
function parsearFechaReserva(string $fechaHora): int
{
    $timestamp = strtotime($fechaHora);
    if ($timestamp === false) {
        jsonError('Fecha y hora inválida', 400);
    }

    return $timestamp;
}

function reservasSolapadas(PDO $pdo, int $inicio, ?int $mesaId = null): array
{
    $inicioSql = date('Y-m-d H:i:s', $inicio);
    $finSql = date('Y-m-d H:i:s', $inicio + DURACION_RESERVA_HORAS * 3600);

    $sql = "SELECT r.id, r.mesa_id, r.fecha_hora,
                   u.nombre AS usuario_nombre, u.email AS usuario_email
            FROM reservas r
            JOIN usuarios u ON u.id = r.usuario_id
            WHERE r.estado = 'confirmada'
              AND r.fecha_hora < ?
              AND DATE_ADD(r.fecha_hora, INTERVAL ? HOUR) > ?";
    $params = [$finSql, DURACION_RESERVA_HORAS, $inicioSql];

    if ($mesaId !== null) {
        $sql .= ' AND r.mesa_id = ?';
        $params[] = $mesaId;
    }

    $stmt = $pdo->prepare($sql . ' ORDER BY r.fecha_hora');
    $stmt->execute($params);

    return $stmt->fetchAll();
}

function validarReservaMesa(PDO $pdo, int $mesaId, int $timestamp, int $cantidadPersonas): array
{
    if ($timestamp < time()) {
        throw new ReservaException('No se puede reservar en una fecha u hora pasada', 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM mesas WHERE id = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$mesaId]);
    $mesa = $stmt->fetch();

    if (!$mesa) {
        throw new ReservaException('Mesa no encontrada', 404);
    }

    if ($cantidadPersonas > (int) $mesa['capacidad']) {
        throw new ReservaException(
            'La mesa solo tiene capacidad para ' . (int) $mesa['capacidad'] . ' personas',
            400
        );
    }

    if (reservasSolapadas($pdo, $timestamp, $mesaId)) {
        throw new ReservaException('La mesa ya está reservada en ese horario', 409);
    }

    return $mesa;
}
