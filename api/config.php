<?php
// Zona horaria de la aplicación. PHP debe interpretar las fechas en la misma
// zona en que MySQL las almacena; si difieren, las reservas se muestran
// corridas y el cálculo de cancelación toma como vencidas reservas futuras.
date_default_timezone_set('America/Argentina/Buenos_Aires');

// Configuración de la base de datos MySQL
define('DB_HOST', 'localhost');
define('DB_NAME', 'el_carpincho_gourmet');
define('DB_USER', 'root');
define('DB_PASS', '');

// Secreto para tokens JWT (cambiar en producción)
define('JWT_SECRET', 'tu_secreto_jwt_cambiar_en_produccion');
define('JWT_EXPIRY', 86400 * 7); // 7 días

// Credenciales del administrador por defecto
define('ADMIN_EMAIL', 'admincarpincho@gmail.com');
define('ADMIN_PASSWORD', 'Admin123');
define('ADMIN_NOMBRE', 'Administrador');
