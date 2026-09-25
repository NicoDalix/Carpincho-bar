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
 
    // Cuánto dura ocupada una mesa por reserva. Con esto definimos un
    // "bloque" de tiempo (inicio -> inicio + duración) en vez de bloquear
    // el día entero. Si más adelante querés que cada reserva dure distinto,
    // esto se puede convertir en una columna de la tabla `reservas`.
    $duracionReservaHoras = 2;
 
    // El front nos manda la fecha/hora que el usuario está mirando. Si no
    // manda nada (compatibilidad hacia atrás), usamos el momento actual.
    $fechaHoraParam = $_GET['fechaHora'] ?? date('Y-m-d\TH:i:s');
    $timestampConsulta = strtotime($fechaHoraParam);
 
    if ($timestampConsulta === false) {
        jsonError('Fecha y hora inválida', 400);
    }
 
    // Ventana de tiempo que el usuario quiere reservar: [inicio, fin)
    $inicioConsulta = date('Y-m-d H:i:s', $timestampConsulta);
    $finConsulta = date('Y-m-d H:i:s', $timestampConsulta + $duracionReservaHoras * 3600);
 
    // Una mesa está ocupada para ESA ventana si existe una reserva confirmada
    // cuyo propio bloque [fecha_hora, fecha_hora + duración) se superpone con
    // la ventana pedida. Es la condición clásica de solapamiento de intervalos:
    // (inicio_existente < fin_pedido) AND (fin_existente > inicio_pedido)
    $stmtReserva = $pdo->prepare(
        "SELECT mesa_id FROM reservas
         WHERE estado = 'confirmada'
           AND fecha_hora < ?
           AND DATE_ADD(fecha_hora, INTERVAL ? HOUR) > ?
         GROUP BY mesa_id"
    );
    $stmtReserva->execute([$finConsulta, $duracionReservaHoras, $inicioConsulta]);
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
