-- ==========================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- PROYECTO: SmartEconomato
-- ==========================================

DROP DATABASE IF EXISTS SmartEconomato;

CREATE DATABASE SmartEconomato CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE SmartEconomato;

-- ==========================================
-- 1. CREACIÓN DE TABLAS MAESTRAS
-- ==========================================

-- TABLA DE USUARIO
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    rol ENUM('admin', 'profesor', 'alumno', 'almacen') NOT NULL DEFAULT 'alumno'
);

-- TABLA CATEGORÍA DE PRODUCTOS
CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- TABLA DE PROVEEDORES
CREATE TABLE proveedor (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT
);

-- TABLA DE PRODUCTOS (Definición genérica)
CREATE TABLE producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    imagen VARCHAR(255) DEFAULT 'no-image.png',
    id_categoria INT,
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE SET NULL
);

-- ==========================================
-- 2. CREACIÓN DE TABLAS RELACIONALES
-- ==========================================

-- TABLA PRODUCTO - PROVEEDOR
-- Define el precio y el código específico de cada proveedor
CREATE TABLE producto_proveedor (
    id_producto_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_proveedor INT NOT NULL,
    codigo_referencia VARCHAR(50),
    precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON DELETE CASCADE
);

-- TABLA INVENTARIO
-- Controla el stock real de una referencia específica
CREATE TABLE inventario (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    id_producto_proveedor INT NOT NULL UNIQUE,
    stock_actual DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10, 2) DEFAULT 5,
    ubicacion VARCHAR(50),
    FOREIGN KEY (id_producto_proveedor) REFERENCES producto_proveedor(id_producto_proveedor) ON DELETE CASCADE
);

-- ==========================================
-- 3. TABLAS TRANSACCIONALES (Pedidos, Movimientos)
-- ==========================================

-- TABLA PEDIDOS
CREATE TABLE pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATE,
    estado ENUM('pendiente', 'aprobado', 'recibido', 'cancelado') DEFAULT 'pendiente',
    total DECIMAL(10, 2) DEFAULT 0.00, -- CAMBIO REALIZADO: Campo total añadido
    observaciones TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- LÍNEA DE PEDIDO (Detalle)
CREATE TABLE linea_pedido (
    id_linea_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto_proveedor INT NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_momento DECIMAL(10, 2), -- Precio congelado al momento de la compra
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (cantidad * precio_momento) STORED, -- Opcional: Columna calculada
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto_proveedor) REFERENCES producto_proveedor(id_producto_proveedor)
);

-- TABLA MOVIMIENTOS (Historial de Entradas/Salidas/Recepciones)
CREATE TABLE movimiento (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_producto_proveedor INT NOT NULL,
    tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(255), -- Aquí guardaremos el Albarán o la razón del ajuste
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_producto_proveedor) REFERENCES producto_proveedor(id_producto_proveedor)
);

-- ==========================================
-- 4. VISTAS (VIEWS) PARA FACILITAR EL DESARROLLO
-- ==========================================

-- VISTA ARTÍCULOS COMPLETOS
CREATE OR REPLACE VIEW vista_articulos AS
SELECT 
    p.id_producto,
    pp.id_producto_proveedor, 
    pp.codigo_referencia as codigo,
    p.nombre,
    c.nombre as categoria,
    p.unidad_medida as unidad,
    p.descripcion,
    p.imagen,
    prov.nombre as proveedor,
    pp.precio_unitario as precio,
    i.stock_actual as stock,
    i.stock_minimo
FROM producto p
JOIN categoria c ON p.id_categoria = c.id_categoria
JOIN producto_proveedor pp ON p.id_producto = pp.id_producto
JOIN proveedor prov ON pp.id_proveedor = prov.id_proveedor
JOIN inventario i ON pp.id_producto_proveedor = i.id_producto_proveedor;

-- VISTA PEDIDOS RESUMEN
-- Úsala para el historial de pedidos
CREATE OR REPLACE VIEW vista_pedidos AS
SELECT 
    pe.id_pedido,
    u.nombre as solicitante,
    pe.fecha_creacion as fecha,
    pe.estado,
    pe.total
FROM pedido pe
JOIN usuario u ON pe.id_usuario = u.id_usuario;




-- ==========================================
-- 5. POBLACIÓN DE DATOS
-- ==========================================

-- Limpiamos las tablas antes de insertar para evitar duplicados
SET FOREIGN_KEY_CHECKS = 0; 
TRUNCATE TABLE movimiento;
TRUNCATE TABLE linea_pedido;
TRUNCATE TABLE pedido;
TRUNCATE TABLE inventario;
TRUNCATE TABLE producto_proveedor;
TRUNCATE TABLE producto;
TRUNCATE TABLE proveedor;
TRUNCATE TABLE categoria;
TRUNCATE TABLE usuario;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. INSERTAR USUARIOS
INSERT INTO usuario (id_usuario, username, password, rol, nombre, apellidos, email, telefono) VALUES
(1, 'tcasest', 'secret', 'admin', 'Tanausú', 'Castrillo Estévez', 'tcasest@gobiernodecanarias.org', '+34 91 123 45 67'),
(2, 'aruiz', '12345', 'alumno', 'Alexis', 'Ruiz Salazar', 'alexisruiz.daw@gmail.com', '639488426'),
(3, '1595', '1234', 'profesor', 'Alexis', 'Ruiz Salazar', 'alexisruiz7687@gmail.com', '2345'),
(4, 'amorales', '222222', 'profesor', 'Andres', 'Morales', 'amorales@gmail.com', '222222'),
(5, 'phernandez', '1234', 'profesor', 'Paula', 'hernandez', 'paula@gmail.com', '123456'),
(6, 'dmartinez', '12abc', 'profesor', 'Darel', 'Martinez', 'darelMartinez@gmail.com', '122344'),
(7, 'valonso', '1234', 'profesor', 'Victor', 'Alonso', 'victoralonsoglez0308@gmail.com', '5432132344'),
(8, 'araya', '1234', 'alumno', 'Alba Maria', 'Raya Herrera', 'Albarhclase3@gmail.com', '12312312'),
(9, 'druiz', '1234', 'profesor', 'Daniel', 'Ruiz', 'ale@ru.es', '18274'),
(10, 'dsalazar', '1234', 'alumno', 'Daniel', 'Salazar', 'da@d.com', '8484830902');

-- 2. INSERTAR CATEGORÍAS
INSERT INTO categoria (id_categoria, nombre) VALUES
(1, 'Frutas Frescas'), (2, 'Verduras y Hortalizas'), (3, 'Carnes Rojas'), (4, 'Aves y Caza'),
(5, 'Pescados Frescos'), (6, 'Mariscos y Crustáceos'), (7, 'Lácteos'), (8, 'Quesos'),
(9, 'Huevos'), (10, 'Panadería'), (11, 'Aceites y Vinagres'), (12, 'Especias y Condimentos'), (13, 'Bebidas');

-- 3. INSERTAR PROVEEDORES
INSERT INTO proveedor (id_proveedor, nombre, contacto) VALUES
(1, 'Distribuciones Alimentarias Mediterráneo', 'Carlos Mendoza'),
(2, 'Frutas y Verduras Frescas SL', 'María López'),
(3, 'Carnicerías Selectas del Norte', 'Roberto García'),
(4, 'Pescados y Mariscos Atlántico', 'Ana Martínez'),
(5, 'Lácteos Valle Natural', 'Pedro Sánchez'),
(6, 'Distribuidora de Aceites Oro Verde', 'Isabel Ramírez'),
(7, 'Especias y Condimentos del Mundo', 'Ahmed Al-Farsi'),
(8, 'Bebidas y Vinos Peninsulares', 'Laura Fernández');

-- 4. INSERTAR PRODUCTOS (Genéricos)
INSERT INTO producto (id_producto, nombre, id_categoria, unidad_medida, imagen) VALUES
(1, 'Tomate Raf', 1, 'kg', 'tomate-raf.jpg'),
(2, 'Lechuga Iceberg', 2, 'unidad', 'lechuga-iceberg.jpg'),
(3, 'Solomillo de Ternera', 3, 'kg', 'solomillo-ternera.jpg'),
(4, 'Pechuga de Pollo', 4, 'kg', 'pechuga-pollo.jpg'),
(5, 'Salmón Fresco', 5, 'kg', 'salmon-fresco.jpg'),
(6, 'Gambas Blancas', 6, 'kg', 'gambas-blancas.jpg'),
(7, 'Leche Entera', 7, 'litro', 'leche-entera.jpg'),
(8, 'Queso Manchego', 8, 'kg', 'queso-manchego.jpg'),
(9, 'Huevos Camperos', 9, 'docena', 'huevos-camperos.jpg'),
(10, 'Pan de Barra', 10, 'unidad', 'pan-barra.jpg'),
(11, 'Aceite de Oliva Virgen Extra', 11, 'litro', 'aceite-oliva.jpg'),
(12, 'Vinagre de Jerez', 11, 'litro', 'vinagre-jerez.jpg'),
(13, 'Pimentón de la Vera', 12, '100g', 'pimenton-vera.jpg'),
(14, 'Azafrán en hebras', 12, '1g', 'azafran-hebras.jpg'),
(15, 'Vino Tinto Reserva', 13, 'botella', 'vino-tinto.jpg'),
(16, 'Agua Mineral', 13, 'botella', 'agua-mineral.jpg'),
(17, 'Plátanos de Canarias', 1, 'kg', 'platanos-canarias.jpg'),
(18, 'Naranjas Valencia', 1, 'kg', 'naranjas-valencia.jpg'),
(19, 'Zanahorias', 2, 'kg', 'zanahorias.jpg'),
(20, 'Cebollas', 2, 'kg', 'cebollas.jpg'),
(21, 'Lomo de Cerdo', 3, 'kg', 'lomo-cerdo.jpg'),
(22, 'Chuletas de Cordero', 3, 'kg', 'chuletas-cordero.jpg'),
(23, 'Muslos de Pollo', 4, 'kg', 'muslos-pollo.jpg'),
(24, 'Pavo Pechuga', 4, 'kg', 'pechuga-pavo.jpg'),
(25, 'Merluza Fresca', 5, 'kg', 'merluza-fresca.jpg'),
(26, 'Lubina Fresca', 5, 'kg', 'lubina-fresca.jpg'),
(27, 'Mejillones', 6, 'kg', 'mejillones.jpg'),
(28, 'Almejas Finas', 6, 'kg', 'almejas-finas.jpg'),
(29, 'Yogur Natural', 7, 'unidad', 'yogur-natural.jpg'),
(30, 'Mantequilla', 7, '250g', 'mantequilla.jpg'),
(31, 'Queso Brie', 8, 'kg', 'queso-brie.jpg'),
(32, 'Queso Cabrales', 8, 'kg', 'queso-cabrales.jpg'),
(33, 'Huevos Ecológicos', 9, 'docena', 'huevos-ecologicos.jpg'),
(34, 'Pan Integral', 10, 'unidad', 'pan-integral.jpg'),
(35, 'Baguette', 10, 'unidad', 'baguette.jpg'),
(36, 'Aceite de Oliva Virgen', 11, 'litro', 'aceite-virgen.jpg'),
(37, 'Vinagre de Módena', 11, '500ml', 'vinagre-modena.jpg'),
(38, 'Orégano', 12, '50g', 'oregano.jpg'),
(39, 'Pimienta Negra', 12, '50g', 'pimienta-negra.jpg'),
(40, 'Vino Blanco', 13, 'botella', 'vino-blanco.jpg'),
(41, 'Cerveza Rubia', 13, 'botella', 'cerveza-rubia.jpg'),
(42, 'Refresco de Cola', 13, 'lata', 'refresco-cola.jpg'),
(43, 'Manzanas Golden', 1, 'kg', 'manzanas-golden.jpg'),
(44, 'Peras Conferencia', 1, 'kg', 'peras-conferencia.jpg'),
(45, 'Pimientos Rojos', 2, 'kg', 'pimientos-rojos.jpg'),
(46, 'Patatas', 2, 'kg', 'patatas.jpg'),
(47, 'Filetes de Ternera', 3, 'kg', 'filetes-ternera.jpg'),
(48, 'Costillas de Cerdo', 3, 'kg', 'costillas-cerdo.jpg'),
(49, 'Alitas de Pollo', 4, 'kg', 'alitas-pollo.jpg'),
(50, 'Codornices', 4, 'kg', 'codornices.jpg');

-- 5. INSERTAR RELACIÓN PRODUCTO-PROVEEDOR (Precios y códigos)
INSERT INTO producto_proveedor (id_producto_proveedor, id_producto, id_proveedor, codigo_referencia, precio_unitario) VALUES
(1, 1, 2, '8410001000015', 4.00), (2, 2, 2, '8410001000022', 1.15), (3, 3, 3, '8410001000039', 24.90),
(4, 4, 3, '8410001000046', 7.85), (5, 5, 4, '8410001000053', 18.50), (6, 6, 4, '8410001000060', 26.40),
(7, 7, 5, '8410001000077', 0.95), (8, 8, 5, '8410001000084', 16.80), (9, 9, 5, '8410001000091', 2.95),
(10, 10, 1, '8410001000107', 1.10), (11, 11, 6, '8410001000114', 8.90), (12, 12, 6, '8410001000121', 6.40),
(13, 13, 7, '8410001000138', 4.95), (14, 14, 7, '8410001000145', 13.20), (15, 15, 8, '8410001000152', 14.80),
(16, 16, 8, '8410001000169', 0.65), (17, 17, 2, '8410001000176', 1.95), (18, 18, 2, '8410001000183', 1.45),
(19, 19, 2, '8410001000190', 0.85), (20, 20, 2, '8410001000206', 0.75), (21, 21, 3, '8410001000213', 11.90),
(22, 22, 3, '8410001000220', 16.75), (23, 23, 3, '8410001000237', 5.45), (24, 24, 3, '8410001000244', 9.20),
(25, 25, 4, '8410001000251', 12.80), (26, 26, 4, '8410001000268', 15.90), (27, 27, 4, '8410001000275', 8.50),
(28, 28, 4, '8410001000282', 18.75), (29, 29, 5, '8410001000299', 0.45), (30, 30, 5, '8410001000305', 2.85),
(31, 31, 5, '8410001000312', 12.40), (32, 32, 5, '8410001000329', 19.80), (33, 33, 5, '8410001000336', 3.45),
(34, 34, 1, '8410001000343', 1.35), (35, 35, 1, '8410001000350', 0.95), (36, 36, 6, '8410001000367', 6.75),
(37, 37, 6, '8410001000374', 5.20), (38, 38, 7, '8410001000381', 2.15), (39, 39, 7, '8410001000398', 3.45),
(40, 40, 8, '8410001000404', 8.90), (41, 41, 8, '8410001000411', 1.20), (42, 42, 8, '8410001000428', 0.85),
(43, 43, 2, '8410001000435', 1.75), (44, 44, 2, '8410001000442', 2.10), (45, 45, 2, '8410001000459', 2.45),
(46, 46, 2, '8410001000466', 0.65), (47, 47, 3, '8410001000473', 19.50), (48, 48, 3, '8410001000480', 8.95),
(49, 49, 3, '8410001000497', 4.25), (50, 50, 3, '8410001000503', 14.20);

-- 6. INSERTAR INVENTARIO (Stock)
INSERT INTO inventario (id_inventario, id_producto_proveedor, stock_actual, stock_minimo) VALUES
(1, 1, 85, 30), (2, 2, 120, 40), (3, 3, 35, 12), (4, 4, 65, 25), (5, 5, 28, 10), (6, 6, 18, 8),
(7, 7, 150, 50), (8, 8, 42, 15), (9, 9, 80, 30), (10, 10, 95, 35), (11, 11, 60, 20), (12, 12, 35, 12),
(13, 13, 45, 15), (14, 14, 25, 8), (15, 15, 48, 18), (16, 16, 200, 80), (17, 17, 75, 25), (18, 18, 110, 40),
(19, 19, 90, 30), (20, 20, 130, 45), (21, 21, 38, 15), (22, 22, 22, 8), (23, 23, 55, 20), (24, 24, 32, 12),
(25, 25, 26, 10), (26, 26, 7, 8), (27, 27, 11, 12), (28, 28, 15, 6), (29, 29, 180, 60), (30, 30, 65, 20),
(31, 31, 28, 10), (32, 32, 18, 6), (33, 33, 45, 15), (34, 34, 70, 25), (35, 35, 85, 30), (36, 36, 55, 18),
(37, 37, 40, 12), (38, 38, 60, 20), (39, 39, 50, 15), (40, 40, 52, 18), (41, 41, 160, 50), (42, 42, 220, 80),
(43, 43, 95, 30), (44, 44, 70, 25), (45, 45, 65, 20), (46, 46, 180, 60), (47, 47, 30, 10), (48, 48, 42, 15),
(49, 49, 58, 20), (50, 50, 16, 6);