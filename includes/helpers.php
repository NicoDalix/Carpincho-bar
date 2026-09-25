<?php

function sendCorsHeaders(): void
{
    require_once __DIR__ . '/security.php';
    sendSecurityHeaders();
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
}

function handleOptions(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        sendCorsHeaders();
        http_response_code(204);
        exit;
    }
}

function jsonResponse(array $data, int $status = 200): void
{
    sendCorsHeaders();
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message, int $status = 400): void
{
    jsonResponse(['error' => $message], $status);
}

function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}

/**
 * Obtiene el header Authorization de la petición.
 *
 * Según el servidor (mod_php, CGI/FastCGI) el header puede llegar en distintas
 * variables o directamente no estar en $_SERVER. Se prueban las tres fuentes
 * conocidas antes de darlo por ausente.
 */
function getAuthorizationHeader(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if ($header === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                $header = $value;
                break;
            }
        }
    }

    return $header;
}

function getAuthUser(): ?array
{
    require_once __DIR__ . '/jwt.php';

    $authHeader = getAuthorizationHeader();
    if (!preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        return null;
    }

    return verifyJWT(trim($matches[1]));
}

function requireAuth(): array
{
    $user = getAuthUser();
    if (!$user) {
        jsonError('Token no proporcionado o inválido', 401);
    }

    return $user;
}

function requireAdmin(): array
{
    $user = requireAuth();
    if (($user['rol'] ?? '') !== 'admin') {
        jsonError('Acceso denegado. Se requiere rol de administrador.', 403);
    }

    return $user;
}

function mesaToArray(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'numero' => (int) $row['numero'],
        'sector' => $row['sector'],
        'capacidad' => (int) $row['capacidad'],
        'disponible' => (bool) ($row['disponible'] ?? true),
        'tarifaMinima' => (float) $row['tarifa_minima'],
    ];
}
