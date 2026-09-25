-- Base de datos del restaurante
CREATE DATABASE IF NOT EXISTS restaurante_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurante_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NULL,
    rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    sector ENUM('interior', 'exclusivo', 'patio') NOT NULL,
    capacidad INT NOT NULL,
    tarifa_minima DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mesa_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    cantidad_personas INT NOT NULL,
    tarifa_minima DECIMAL(10, 2) NOT NULL,
    estado ENUM('confirmada', 'cancelada') NOT NULL DEFAULT 'confirmada',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion DATETIME NULL,
    reembolso DECIMAL(10, 2) NULL,
    porcentaje_reembolso INT NULL,
    creada_por_admin TINYINT(1) NOT NULL DEFAULT 0,
    nombre_cliente VARCHAR(255) NULL,
    telefono VARCHAR(50) NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carta_platos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS carta_bebidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS login_intentos (
    ip VARCHAR(45) NOT NULL PRIMARY KEY,
    intentos INT NOT NULL DEFAULT 0,
    bloqueado_hasta INT UNSIGNED NOT NULL DEFAULT 0,
    ventana_inicio INT UNSIGNED NOT NULL DEFAULT 0
);
