<?php
require_once __DIR__ . '/../../includes/helpers.php';
require_once __DIR__ . '/../../includes/db.php';

handleOptions();
requireAdmin();

try {
    initDatabase();
    $pdo = getDB();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = getJsonBody();
        $tipo = $body['tipo'] ?? '';
        $nombre = trim($body['nombre'] ?? '');
        $precio = (float) ($body['precio'] ?? 0);
        $categoria = trim($body['categoria'] ?? '');

        if ($nombre === '') {
            jsonError('El nombre es obligatorio');
        }
        if ($precio <= 0) {
            jsonError('El precio debe ser mayor a 0');
        }
        if ($categoria === '') {
            jsonError('La categoría es obligatoria');
        }

        $tabla = $tipo === 'plato' ? 'carta_platos' : ($tipo === 'bebida' ? 'carta_bebidas' : null);
        if (!$tabla) {
            jsonError('Tipo de ítem inválido');
        }

        $insert = $pdo->prepare("INSERT INTO $tabla (nombre, precio, categoria) VALUES (?, ?, ?)");
        $insert->execute([$nombre, round($precio), $categoria]);

        jsonResponse([
            'id' => (int) $pdo->lastInsertId(),
            'nombre' => $nombre,
            'precio' => round($precio),
            'categoria' => $categoria,
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $tipo = $_GET['tipo'] ?? '';
        $id = (int) ($_GET['id'] ?? 0);

        $tabla = $tipo === 'plato' ? 'carta_platos' : ($tipo === 'bebida' ? 'carta_bebidas' : null);
        if (!$tabla || $id <= 0) {
            jsonError('Parámetros inválidos');
        }

        $stmt = $pdo->prepare("SELECT * FROM $tabla WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if (!$item) {
            jsonError('Ítem no encontrado', 404);
        }

        $delete = $pdo->prepare("DELETE FROM $tabla WHERE id = ?");
        $delete->execute([$id]);

        jsonResponse([
            'id' => (int) $item['id'],
            'nombre' => $item['nombre'],
            'precio' => (float) $item['precio'],
            'categoria' => $item['categoria'],
        ]);
    }

    jsonError('Método no permitido', 405);
} catch (PDOException $e) {
    jsonError('Error al gestionar la carta', 500);
}
