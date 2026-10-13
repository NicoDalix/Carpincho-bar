<?php
date_default_timezone_set('America/Argentina/Buenos_Aires');

define('DB_HOST', 'localhost');
define('DB_NAME', 'el_carpincho_gourmet');
define('DB_USER', 'root');
define('DB_PASS', '');

define('JWT_SECRET', (function (): string {
    $archivo = __DIR__ . '/jwt-secret.php';
    if (!is_file($archivo)) {
        $secreto = bin2hex(random_bytes(32));
        file_put_contents($archivo, "<?php\nreturn '" . $secreto . "';\n", LOCK_EX);
    }

    return require $archivo;
})());
define('JWT_EXPIRY', 86400 * 7); // 7 días

// Orígenes extra para CORS, ej: ['http://localhost:5173']
define('CORS_ORIGENES', []);

// Se crea al instalar, después cambiar la contraseña
define('ADMIN_EMAIL', 'admincarpincho@gmail.com');
define('ADMIN_PASSWORD', 'Admin123');
define('ADMIN_NOMBRE', 'Administrador');
