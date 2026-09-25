# Instalación con PHP y MySQL

Esta versión usa **PHP** como backend y **MySQL** como base de datos, con validación de contraseñas en cliente y servidor.

## Requisitos

- [XAMPP](https://www.apachefriends.org/) (Apache + PHP + MySQL) o similar
- PHP 8.0 o superior con extensión PDO MySQL

## Pasos de instalación

### 1. Copiar el proyecto

Colocá la carpeta del proyecto dentro de `htdocs` de XAMPP, por ejemplo:

```
C:\xampp\htdocs\Nuevo proyecto\
```

### 2. Iniciar servicios

Abrí el panel de control de XAMPP e iniciá **Apache** y **MySQL**.

### 3. Configurar la base de datos

Editá `api/config.php` si tus credenciales de MySQL son distintas:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'restaurante_db');
define('DB_USER', 'root');
define('DB_PASS', '');  // vacío por defecto en XAMPP
```

### 4. Ejecutar la instalación

Abrí en el navegador:

```
http://localhost/Nuevo%20proyecto/database/install.php
```

Esto crea la base de datos, las tablas y los datos iniciales (admin, mesas, carta).

### 5. Usar la aplicación

```
http://localhost/Nuevo%20proyecto/public/index.html
```

## Credenciales de administrador

- **Email:** admincarpincho@gmail.com
- **Contraseña:** Admin123

(La contraseña cumple el requisito de mínimo 8 caracteres con letras y números.)

## Validación de contraseñas

Al registrarse, la contraseña debe cumplir:

| Requisito | Cliente (JS) | Servidor (PHP) |
|-----------|--------------|----------------|
| Mínimo 8 caracteres | ✓ | ✓ |
| Al menos una letra | ✓ | ✓ |
| Al menos un número | ✓ | ✓ |

- **Cliente:** `public/password-validation.js` + `public/auth.js`
- **Servidor:** `includes/validation.php` (usado en `api/register.php`)

## Estructura PHP

```
api/
├── config.php           # Configuración DB y JWT
├── login.php
├── register.php         # Valida contraseña en servidor
├── carta.php
├── mesas.php
├── reservas.php
├── reservas_cancelar.php
└── admin/
    ├── reservas.php
    ├── mesas.php
    └── carta.php

includes/
├── db.php               # Conexión PDO + datos iniciales
├── validation.php       # Validación de contraseña/email/nombre
├── jwt.php              # Tokens de autenticación
└── helpers.php          # CORS, respuestas JSON, auth middleware

database/
├── schema.sql           # Esquema MySQL
└── install.php          # Script de instalación
```

## Solución de problemas

### Error de conexión a MySQL
- Verificá que MySQL esté corriendo en XAMPP
- Revisá usuario/contraseña en `api/config.php`

### Error 404 en la API
- La app debe abrirse vía `http://localhost/.../public/`, no como archivo `file://`
- Apache debe estar activo

### "El email ya está registrado"
- Es normal si ya registraste ese email; usá otro o iniciá sesión

### CORS / fetch falla
- Usá la URL con Apache (`http://localhost/...`), no abras el HTML directamente

## Notas

- El JWT_SECRET en `api/config.php` debe cambiarse en producción
- Las contraseñas se guardan hasheadas con `password_hash()` de PHP
- La versión Node.js (`server.js`) y la versión localStorage (`README_SIN_NODEJS.md`) siguen disponibles como alternativas
