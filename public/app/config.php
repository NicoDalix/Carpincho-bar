<?php
date_default_timezone_set('America/Argentina/Buenos_Aires');

// Configuración de la base de datos MySQL
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

// Otros sitios que pueden llamar a la API desde el navegador (CORS). Vacío:
// solo el propio sitio. Ejemplo: ['http://localhost:5173']
define('CORS_ORIGENES', []);

// Administrador que se crea en la instalación (solo si todavía no existe).
// Después de instalar conviene cambiarle la contraseña.
define('ADMIN_EMAIL', 'admincarpincho@gmail.com');
define('ADMIN_PASSWORD', 'Admin123');
define('ADMIN_NOMBRE', 'Administrador');
