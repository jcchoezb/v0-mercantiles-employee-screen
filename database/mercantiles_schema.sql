-- =============================================
-- MERCANTILES - ESQUEMA DE BASE DE DATOS MySQL
-- Panel de Administración para Empleados
-- =============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS mercantiles_db;
USE mercantiles_db;

-- =============================================
-- TABLA: roles
-- Roles de los empleados en el sistema
-- =============================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    permisos JSON COMMENT 'Permisos del rol en formato JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: empleados
-- Usuarios que acceden al panel de administración
-- =============================================
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt de la contraseña',
    avatar_url VARCHAR(500),
    rol_id INT NOT NULL,
    departamento VARCHAR(100),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Índice para búsquedas por email
CREATE INDEX idx_empleados_email ON empleados(email);
CREATE INDEX idx_empleados_activo ON empleados(activo);

-- =============================================
-- TABLA: clientes
-- Clientes gestionados por los empleados
-- =============================================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    empresa VARCHAR(150),
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Ecuador',
    estado ENUM('activo', 'pendiente', 'inactivo') DEFAULT 'pendiente',
    notas TEXT,
    fuente ENUM('publicidad', 'referido', 'web', 'chatbot', 'otro') DEFAULT 'chatbot',
    empleado_asignado_id INT NULL COMMENT 'Empleado responsable del cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_asignado_id) REFERENCES empleados(id) ON DELETE SET NULL
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_clientes_estado ON clientes(estado);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_empleado ON clientes(empleado_asignado_id);

-- =============================================
-- TABLA: categorias_productos
-- Categorías para organizar productos
-- =============================================
CREATE TABLE categorias_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    icono VARCHAR(50) COMMENT 'Nombre del icono a usar',
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA: productos
-- Catálogo de productos de Mercantiles
-- =============================================
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(12, 2) NOT NULL,
    precio_oferta DECIMAL(12, 2) NULL,
    categoria_id INT NOT NULL,
    imagen_url VARCHAR(500),
    sku VARCHAR(50) UNIQUE COMMENT 'Código único del producto',
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT 5 COMMENT 'Alerta cuando stock < stock_minimo',
    activo BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    caracteristicas JSON COMMENT 'Características adicionales en JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_productos(id) ON DELETE RESTRICT
);

-- Índices para búsquedas
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_sku ON productos(sku);

-- =============================================
-- TABLA: conversaciones
-- Conversaciones de chat entre clientes y empleados
-- =============================================
CREATE TABLE conversaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    empleado_id INT NULL COMMENT 'NULL si aún no ha sido tomada',
    estado ENUM('pendiente', 'activa', 'cerrada') DEFAULT 'pendiente',
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    tema VARCHAR(255) COMMENT 'Tema o asunto de la conversación',
    origen ENUM('chatbot', 'publicidad', 'web', 'directo') DEFAULT 'chatbot',
    canal VARCHAR(50) DEFAULT 'web' COMMENT 'Canal de origen: web, whatsapp, etc.',
    motivo_derivacion VARCHAR(255) COMMENT 'Por qué el chatbot derivó la conversación',
    calificacion INT NULL COMMENT 'Calificación del cliente 1-5',
    tiempo_respuesta_promedio INT COMMENT 'En segundos',
    cerrada_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL
);

-- Índices para filtrar conversaciones
CREATE INDEX idx_conversaciones_estado ON conversaciones(estado);
CREATE INDEX idx_conversaciones_empleado ON conversaciones(empleado_id);
CREATE INDEX idx_conversaciones_cliente ON conversaciones(cliente_id);
CREATE INDEX idx_conversaciones_fecha ON conversaciones(created_at);

-- =============================================
-- TABLA: mensajes
-- Mensajes dentro de cada conversación
-- =============================================
CREATE TABLE mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversacion_id INT NOT NULL,
    remitente_tipo ENUM('cliente', 'empleado', 'bot', 'sistema') NOT NULL,
    remitente_id INT NULL COMMENT 'ID del cliente o empleado, NULL si es bot/sistema',
    contenido TEXT NOT NULL,
    tipo_contenido ENUM('texto', 'imagen', 'archivo', 'audio', 'video', 'ubicacion') DEFAULT 'texto',
    archivo_url VARCHAR(500) NULL,
    leido BOOLEAN DEFAULT FALSE,
    leido_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id);
CREATE INDEX idx_mensajes_fecha ON mensajes(created_at);
CREATE INDEX idx_mensajes_leido ON mensajes(leido);

-- Foreign key separada para mejor rendimiento
ALTER TABLE mensajes ADD CONSTRAINT fk_mensajes_conversacion 
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE;

-- =============================================
-- TABLA: chatbot_citas
-- Citas agendadas por el chatbot
-- =============================================
CREATE TABLE chatbot_citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    conversacion_id INT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_cita DATETIME NOT NULL,
    duracion_minutos INT DEFAULT 30,
    tipo ENUM('presencial', 'virtual', 'telefonica') DEFAULT 'virtual',
    ubicacion VARCHAR(255),
    link_reunion VARCHAR(500) COMMENT 'Link de Zoom, Meet, etc.',
    estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio') DEFAULT 'pendiente',
    empleado_asignado_id INT NULL,
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE SET NULL,
    FOREIGN KEY (empleado_asignado_id) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE INDEX idx_citas_fecha ON chatbot_citas(fecha_cita);
CREATE INDEX idx_citas_estado ON chatbot_citas(estado);
CREATE INDEX idx_citas_cliente ON chatbot_citas(cliente_id);

-- =============================================
-- TABLA: chatbot_cotizaciones
-- Cotizaciones generadas por el chatbot
-- =============================================
CREATE TABLE chatbot_cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_cotizacion VARCHAR(50) UNIQUE NOT NULL,
    cliente_id INT NOT NULL,
    conversacion_id INT NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(12, 2) DEFAULT 0,
    impuestos DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    estado ENUM('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada') DEFAULT 'borrador',
    valida_hasta DATE,
    notas TEXT,
    terminos_condiciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE SET NULL
);

CREATE INDEX idx_cotizaciones_numero ON chatbot_cotizaciones(numero_cotizacion);
CREATE INDEX idx_cotizaciones_cliente ON chatbot_cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_estado ON chatbot_cotizaciones(estado);

-- =============================================
-- TABLA: chatbot_cotizaciones_items
-- Detalle de productos en cada cotización
-- =============================================
CREATE TABLE chatbot_cotizaciones_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    producto_id INT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    descuento DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (cotizacion_id) REFERENCES chatbot_cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- =============================================
-- TABLA: chatbot_encuestas
-- Encuestas completadas por clientes
-- =============================================
CREATE TABLE chatbot_encuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    conversacion_id INT NULL,
    tipo_encuesta VARCHAR(100) NOT NULL COMMENT 'satisfaccion, nps, feedback, etc.',
    titulo VARCHAR(200),
    respuestas JSON NOT NULL COMMENT 'Preguntas y respuestas en JSON',
    puntuacion_general INT NULL COMMENT 'Puntuación 1-10 si aplica',
    comentarios TEXT,
    completada BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE SET NULL
);

CREATE INDEX idx_encuestas_tipo ON chatbot_encuestas(tipo_encuesta);
CREATE INDEX idx_encuestas_cliente ON chatbot_encuestas(cliente_id);
CREATE INDEX idx_encuestas_fecha ON chatbot_encuestas(created_at);

-- =============================================
-- TABLA: chatbot_documentos
-- Documentos generados por el chatbot
-- =============================================
CREATE TABLE chatbot_documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    conversacion_id INT NULL,
    tipo_documento ENUM('contrato', 'factura', 'recibo', 'informe', 'otro') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    archivo_url VARCHAR(500) NOT NULL,
    tamanio_bytes INT,
    formato VARCHAR(20) COMMENT 'pdf, docx, xlsx, etc.',
    generado_automaticamente BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE SET NULL
);

CREATE INDEX idx_documentos_tipo ON chatbot_documentos(tipo_documento);
CREATE INDEX idx_documentos_cliente ON chatbot_documentos(cliente_id);

-- =============================================
-- TABLA: sesiones_empleados
-- Control de sesiones activas
-- =============================================
CREATE TABLE sesiones_empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expira_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

CREATE INDEX idx_sesiones_token ON sesiones_empleados(token_hash);
CREATE INDEX idx_sesiones_expira ON sesiones_empleados(expira_at);

-- =============================================
-- TABLA: logs_actividad
-- Registro de actividades para auditoría
-- =============================================
CREATE TABLE logs_actividad (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NULL,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL
);

CREATE INDEX idx_logs_empleado ON logs_actividad(empleado_id);
CREATE INDEX idx_logs_fecha ON logs_actividad(created_at);
CREATE INDEX idx_logs_accion ON logs_actividad(accion);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Roles iniciales
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('administrador', 'Acceso completo al sistema', '{"all": true}'),
('supervisor', 'Gestión de empleados y reportes', '{"chat": true, "clientes": true, "productos": true, "historial": true, "reportes": true}'),
('agente', 'Atención al cliente y chat', '{"chat": true, "clientes": true, "historial": true}'),
('vendedor', 'Gestión de productos y cotizaciones', '{"productos": true, "clientes": true, "historial": true}');

-- Categorías de productos
INSERT INTO categorias_productos (nombre, descripcion, icono, orden) VALUES
('Electrónicos', 'Productos electrónicos y tecnología', 'Laptop', 1),
('Hogar', 'Artículos para el hogar', 'Home', 2),
('Ropa', 'Vestimenta y accesorios', 'Shirt', 3),
('Deportes', 'Artículos deportivos', 'Dumbbell', 4),
('Oficina', 'Suministros de oficina', 'Briefcase', 5);

-- Empleado de prueba (password: admin123)
-- Hash generado con bcrypt - en producción usar password real hasheado
INSERT INTO empleados (nombre, email, password_hash, rol_id, departamento, activo) VALUES
('Carlos Mendoza', 'carlos@mercantiles.com', '$2b$10$rQZ8K.1JH6vqHvYpHvYpHuYpHvYpHvYpHvYpHvYpHvYpHvYpHvYpH', 1, 'Administración', TRUE),
('María García', 'maria@mercantiles.com', '$2b$10$rQZ8K.1JH6vqHvYpHvYpHuYpHvYpHvYpHvYpHvYpHvYpHvYpHvYpH', 3, 'Soporte', TRUE),
('Juan Pérez', 'juan@mercantiles.com', '$2b$10$rQZ8K.1JH6vqHvYpHvYpHuYpHvYpHvYpHvYpHvYpHvYpHvYpHvYpH', 3, 'Soporte', TRUE);

-- Productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, categoria_id, sku, stock, activo) VALUES
('Laptop HP Pavilion 15', 'Laptop 15.6" Intel Core i5, 8GB RAM, 256GB SSD', 899.99, 1, 'ELEC-001', 25, TRUE),
('Monitor Samsung 27"', 'Monitor LED Full HD 27 pulgadas', 299.99, 1, 'ELEC-002', 40, TRUE),
('Teclado Mecánico RGB', 'Teclado gaming mecánico con iluminación RGB', 89.99, 1, 'ELEC-003', 100, TRUE),
('Silla Ergonómica', 'Silla de oficina ergonómica con soporte lumbar', 349.99, 5, 'OFIC-001', 15, TRUE),
('Escritorio Ajustable', 'Escritorio con altura ajustable eléctrico', 599.99, 5, 'OFIC-002', 10, TRUE);

-- Clientes de ejemplo
INSERT INTO clientes (nombre, email, telefono, empresa, estado, fuente) VALUES
('Ana López', 'ana.lopez@email.com', '+593 99 123 4567', 'Tech Solutions', 'activo', 'chatbot'),
('Roberto Díaz', 'roberto.diaz@email.com', '+593 98 765 4321', 'Comercial RD', 'pendiente', 'publicidad'),
('Carmen Ruiz', 'carmen.ruiz@email.com', '+593 97 111 2222', NULL, 'activo', 'web');

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de conversaciones con información del cliente y empleado
CREATE VIEW v_conversaciones_detalle AS
SELECT 
    c.id,
    c.estado,
    c.prioridad,
    c.tema,
    c.origen,
    c.created_at,
    cl.id AS cliente_id,
    cl.nombre AS cliente_nombre,
    cl.email AS cliente_email,
    e.id AS empleado_id,
    e.nombre AS empleado_nombre,
    (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id) AS total_mensajes,
    (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id AND m.leido = FALSE AND m.remitente_tipo = 'cliente') AS mensajes_sin_leer
FROM conversaciones c
LEFT JOIN clientes cl ON c.cliente_id = cl.id
LEFT JOIN empleados e ON c.empleado_id = e.id;

-- Vista de historial del chatbot consolidado
CREATE VIEW v_chatbot_historial AS
SELECT 
    'cita' AS tipo,
    cc.id,
    cc.cliente_id,
    cl.nombre AS cliente_nombre,
    cc.titulo AS titulo,
    cc.estado,
    cc.created_at
FROM chatbot_citas cc
JOIN clientes cl ON cc.cliente_id = cl.id
UNION ALL
SELECT 
    'cotizacion' AS tipo,
    cq.id,
    cq.cliente_id,
    cl.nombre AS cliente_nombre,
    CONCAT('Cotización #', cq.numero_cotizacion) AS titulo,
    cq.estado,
    cq.created_at
FROM chatbot_cotizaciones cq
JOIN clientes cl ON cq.cliente_id = cl.id
UNION ALL
SELECT 
    'encuesta' AS tipo,
    ce.id,
    ce.cliente_id,
    cl.nombre AS cliente_nombre,
    ce.titulo,
    IF(ce.completada, 'completada', 'pendiente') AS estado,
    ce.created_at
FROM chatbot_encuestas ce
JOIN clientes cl ON ce.cliente_id = cl.id
UNION ALL
SELECT 
    'documento' AS tipo,
    cd.id,
    cd.cliente_id,
    cl.nombre AS cliente_nombre,
    cd.titulo,
    cd.tipo_documento AS estado,
    cd.created_at
FROM chatbot_documentos cd
JOIN clientes cl ON cd.cliente_id = cl.id
ORDER BY created_at DESC;

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

DELIMITER //

-- Procedimiento para obtener estadísticas del dashboard
CREATE PROCEDURE sp_dashboard_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM clientes WHERE estado = 'activo') AS clientes_activos,
        (SELECT COUNT(*) FROM conversaciones WHERE estado = 'pendiente') AS chats_pendientes,
        (SELECT COUNT(*) FROM productos WHERE activo = TRUE) AS productos_activos,
        (SELECT COUNT(*) FROM chatbot_citas WHERE DATE(fecha_cita) = CURDATE()) AS citas_hoy,
        (SELECT COUNT(*) FROM chatbot_cotizaciones WHERE estado = 'enviada') AS cotizaciones_pendientes;
END //

-- Procedimiento para asignar conversación a empleado
CREATE PROCEDURE sp_tomar_conversacion(
    IN p_conversacion_id INT,
    IN p_empleado_id INT
)
BEGIN
    UPDATE conversaciones 
    SET empleado_id = p_empleado_id, 
        estado = 'activa',
        updated_at = NOW()
    WHERE id = p_conversacion_id AND estado = 'pendiente';
    
    SELECT ROW_COUNT() AS filas_afectadas;
END //

-- Procedimiento para cerrar conversación
CREATE PROCEDURE sp_cerrar_conversacion(
    IN p_conversacion_id INT,
    IN p_calificacion INT
)
BEGIN
    UPDATE conversaciones 
    SET estado = 'cerrada',
        calificacion = p_calificacion,
        cerrada_at = NOW(),
        updated_at = NOW()
    WHERE id = p_conversacion_id;
    
    SELECT ROW_COUNT() AS filas_afectadas;
END //

DELIMITER ;

-- =============================================
-- TRIGGERS
-- =============================================

DELIMITER //

-- Trigger para crear cliente automáticamente si no existe en conversación
CREATE TRIGGER tr_conversacion_before_insert
BEFORE INSERT ON conversaciones
FOR EACH ROW
BEGIN
    IF NEW.cliente_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'cliente_id es requerido';
    END IF;
END //

-- Trigger para actualizar último acceso del empleado
CREATE TRIGGER tr_sesion_after_insert
AFTER INSERT ON sesiones_empleados
FOR EACH ROW
BEGIN
    UPDATE empleados SET ultimo_acceso = NOW() WHERE id = NEW.empleado_id;
END //

DELIMITER ;

-- =============================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =============================================

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX idx_conversaciones_estado_fecha ON conversaciones(estado, created_at);
CREATE INDEX idx_mensajes_conv_fecha ON mensajes(conversacion_id, created_at);
