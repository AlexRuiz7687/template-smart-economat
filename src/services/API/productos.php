<?php
// ==========================================
// API PRODUCTOS - CRUD 
// ==========================================

// 1. Cabeceras CORS y Configuración
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, PATCH, DELETE");
header('Content-Type: application/json; charset=utf-8');

// Manejo de preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'eco-config.php';

try {
    // 2. Conexión a Base de Datos
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $method = $_SERVER['REQUEST_METHOD'];

    // ==========================================
    // GET: LEER PRODUCTOS
    // ==========================================
    if ($method === 'GET') {
        
        // ¿Solicitan un solo producto por ID?
        if (isset($_GET['id'])) {
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                sendResponse(400, ['error' => 'ID inválido']);
            }

            // Usamos la vists para obtener todos los datos consolidados
            $stmt = $conn->prepare("SELECT * FROM vista_articulos WHERE id_producto = ?");
            $stmt->execute([$id]);
            $producto = $stmt->fetch();

            if ($producto) {
                // Formateamos numéricos
                $producto['id'] = (int)$producto['id_producto'];
                $producto['precio'] = (float)$producto['precio'];
                $producto['stock'] = (float)$producto['stock'];
                $producto['stockMinimo'] = (float)$producto['stock_minimo'];
                $producto['categoriaId'] = getCategoriaIdByName($conn, $producto['categoria']);
                
                echo json_encode($producto);
            } else {
                sendResponse(404, ['error' => 'Producto no encontrado']);
            }

        } else {
            // Listado completo
            $stmt = $conn->prepare("SELECT * FROM vista_articulos");
            $stmt->execute();
            $resultados = $stmt->fetchAll();

            $productos = array_map(function($row) {
                return [
                    'id'            => (int)$row['id_producto'],
                    'nombre'        => $row['nombre'],
                    'categoria'     => $row['categoria'],
                    'precio'        => (float)$row['precio'],
                    'stock'         => (float)$row['stock'],
                    'stock_minimo'  => (float)$row['stock_minimo'],
                    'stockMinimo'   => (float)$row['stock_minimo'],
                    'proveedor'     => $row['proveedor'],
                    'descripcion'   => isset($row['descripcion']) ? $row['descripcion'] : '', 
                    'unidad_medida' => $row['unidad'],
                    'imagen'        => $row['imagen'],
                    'codigo'        => $row['codigo']
                ];
            }, $resultados);

            echo json_encode($productos);
        }
    }

    // ==========================================
    // POST: CREAR PRODUCTO
    // ==========================================
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['nombre']) || !isset($input['precio'])) {
            sendResponse(400, ['error' => 'Datos incompletos: nombre y precio son obligatorios']);
        }

        try {
            $conn->beginTransaction();

            // 1. Obtener o Crear Categoría
            $nombreCategoria = isset($input['categoria']) ? trim($input['categoria']) : 'General';
            $idCategoria = getOrCreateCategoria($conn, $nombreCategoria);

            // 2. Insertar Producto (Tabla `producto`)
            $stmtProd = $conn->prepare("INSERT INTO producto (nombre, descripcion, unidad_medida, imagen, id_categoria) VALUES (?, ?, ?, ?, ?)");
            
            // Mapeo de campos
            $nombre = $input['nombre'];
            $descripcion = isset($input['descripcion']) ? $input['descripcion'] : '';
            $unidad = isset($input['unidad']) ? $input['unidad'] : 'unidad';
            $imagen = isset($input['imagenUrl']) ? $input['imagenUrl'] : (isset($input['imagen']) ? $input['imagen'] : 'no-image.png');

            $stmtProd->execute([$nombre, $descripcion, $unidad, $imagen, $idCategoria]);
            $idProducto = $conn->lastInsertId();

            // 3. Obtener o Crear Proveedor
            $nombreProveedor = isset($input['distribuidor']) ? trim($input['distribuidor']) : (isset($input['proveedor']) ? trim($input['proveedor']) : 'Genérico');
            $idProveedor = getOrCreateProveedor($conn, $nombreProveedor);

            // 4. Crear Relación Producto-Proveedor (Tabla `producto_proveedor`)
            // Generamos un código de referencia ficticio si no viene uno, o usamos el ID del input si es un código
            $codigoRef = isset($input['id']) ? $input['id'] : ('REF-' . time());
            $precio = (float)$input['precio'];

            $stmtPP = $conn->prepare("INSERT INTO producto_proveedor (id_producto, id_proveedor, codigo_referencia, precio_unitario) VALUES (?, ?, ?, ?)");
            $stmtPP->execute([$idProducto, $idProveedor, $codigoRef, $precio]);
            $idProductoProveedor = $conn->lastInsertId();

            // 5. Crear Inventario Inicial (Tabla `inventario`)
            $stock = isset($input['stock']) ? (float)$input['stock'] : 0;
            $stockMin = isset($input['stockMinimo']) ? (float)$input['stockMinimo'] : 5;

            $stmtInv = $conn->prepare("INSERT INTO inventario (id_producto_proveedor, stock_actual, stock_minimo) VALUES (?, ?, ?)");
            $stmtInv->execute([$idProductoProveedor, $stock, $stockMin]);

            $conn->commit();

            sendResponse(201, ['message' => 'Producto creado correctamente', 'id' => $idProducto]);

        } catch (Exception $e) {
            $conn->rollBack();
            throw $e;
        }
    }

    // ==========================================
    // PATCH/PUT: ACTUALIZAR PRODUCTO
    // ==========================================
    elseif ($method === 'PATCH' || $method === 'PUT') {
        $id = isset($_GET['id']) ? filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) : null;
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$id) {
            sendResponse(400, ['error' => 'ID de producto requerido']);
        }

        try {
            $conn->beginTransaction();

            // 1. Actualizar Datos Básicos (Tabla `producto`)
            // Construimos dinámicamente la query para actualizar solo lo enviado si es posible, 
            // pero para simplificar actualizaremos los campos principales si están presentes.
            
            $fieldsToUpdate = [];
            $params = [];

            if (isset($input['nombre'])) {
                $fieldsToUpdate[] = "nombre = ?";
                $params[] = $input['nombre'];
            }
            if (isset($input['descripcion'])) {
                $fieldsToUpdate[] = "descripcion = ?";
                $params[] = $input['descripcion'];
            }
            if (isset($input['unidad']) || isset($input['unidadMedida'])) {
                $fieldsToUpdate[] = "unidad_medida = ?";
                $params[] = isset($input['unidad']) ? $input['unidad'] : $input['unidadMedida'];
            }
            if (isset($input['imagen']) || isset($input['imagenUrl'])) {
                $fieldsToUpdate[] = "imagen = ?";
                $params[] = isset($input['imagen']) ? $input['imagen'] : $input['imagenUrl'];
            }
            if (isset($input['categoria'])) {
                $cateId = getOrCreateCategoria($conn, $input['categoria']);
                $fieldsToUpdate[] = "id_categoria = ?";
                $params[] = $cateId;
            }

            if (!empty($fieldsToUpdate)) {
                $sql = "UPDATE producto SET " . implode(", ", $fieldsToUpdate) . " WHERE id_producto = ?";
                $params[] = $id;
                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
            }

            // 2. Actualizar Relaciones (Precios y Stock)
            // IMPORTANTE: Esto asume una relación 1:1 simplificada para la edición desde esta vista.
            // Si el producto tiene múltiples proveedores, esto actualizaría el PRINCIPAL o TODOS si no tenemos cuidado.
            // Aquí buscaremos el `producto_proveedor` asociado. Si hay varios, tomamos el primero (limitación conocida).

            // Obtener ID Producto Proveedor
            $stmtGetPP = $conn->prepare("SELECT id_producto_proveedor FROM producto_proveedor WHERE id_producto = ? LIMIT 1");
            $stmtGetPP->execute([$id]);
            $ppRow = $stmtGetPP->fetch();
            
            if ($ppRow) {
                $idPP = $ppRow['id_producto_proveedor'];

                // Actualizar Proveedor si cambió
                if (isset($input['proveedor']) || isset($input['distribuidor'])) {
                     $nomProv = isset($input['proveedor']) ? $input['proveedor'] : $input['distribuidor'];
                     $idProv = getOrCreateProveedor($conn, $nomProv);
                     $updProv = $conn->prepare("UPDATE producto_proveedor SET id_proveedor = ? WHERE id_producto_proveedor = ?");
                     $updProv->execute([$idProv, $idPP]);
                }

                // Actualizar Precio
                if (isset($input['precio'])) {
                    $updPrecio = $conn->prepare("UPDATE producto_proveedor SET precio_unitario = ? WHERE id_producto_proveedor = ?");
                    $updPrecio->execute([(float)$input['precio'], $idPP]);
                }

                // Actualizar Stock (Tabla `inventario`)
                if (isset($input['stock']) || isset($input['stockMinimo'])) {
                    $invFields = [];
                    $invParams = [];

                    if (isset($input['stock'])) {
                        $invFields[] = "stock_actual = ?";
                        $invParams[] = (float)$input['stock'];
                    }
                    if (isset($input['stockMinimo'])) {
                        $invFields[] = "stock_minimo = ?";
                        $invParams[] = (float)$input['stockMinimo'];
                    }

                    if (!empty($invFields)) {
                        $sqlInv = "UPDATE inventario SET " . implode(", ", $invFields) . " WHERE id_producto_proveedor = ?";
                        $invParams[] = $idPP;
                        $stmtInv = $conn->prepare($sqlInv);
                        $stmtInv->execute($invParams);
                    }
                }
            }

            $conn->commit();
            sendResponse(200, ['message' => 'Producto actualizado correctamente']);

        } catch (Exception $e) {
            $conn->rollBack();
            throw $e;
        }
    }

    // ==========================================
    // DELETE: ELIMINAR PRODUCTO
    // ==========================================
    elseif ($method === 'DELETE') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            sendResponse(400, ['error' => 'ID requerido']);
        }

        try {
            // Gracias a ON DELETE CASCADE en la BD, eliminar de `producto` debería limpiar lo demás.
            // Pero verificamos permisos o lógica extra si fuese necesario.
            $stmt = $conn->prepare("DELETE FROM producto WHERE id_producto = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                sendResponse(200, ['message' => 'Producto eliminado']);
            } else {
                sendResponse(404, ['error' => 'Producto no encontrado']);
            }
        } catch (Exception $e) {
            sendResponse(500, ['error' => 'Error al eliminar: ' . $e->getMessage()]);
        }
    }

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error del servidor: " . $e->getMessage()]);
} finally {
    $conn = null;
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function sendResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

/**
 * Busca una categoría por nombre. Si no existe, la crea.
 */
function getOrCreateCategoria($conn, $nombreCategoria) {
    if (empty($nombreCategoria)) $nombreCategoria = 'General';

    // Buscar
    $stmt = $conn->prepare("SELECT id_categoria FROM categoria WHERE nombre = ?");
    $stmt->execute([$nombreCategoria]);
    $row = $stmt->fetch();

    if ($row) {
        return $row['id_categoria'];
    } else {
        // Crear
        $stmtIns = $conn->prepare("INSERT INTO categoria (nombre) VALUES (?)");
        $stmtIns->execute([$nombreCategoria]);
        return $conn->lastInsertId();
    }
}

/**
 * Busca un proveedor por nombre. Si no existe, lo crea.
 */
function getOrCreateProveedor($conn, $nombreProveedor) {
    if (empty($nombreProveedor)) $nombreProveedor = 'Proveedor Desconocido';

    // Buscar
    $stmt = $conn->prepare("SELECT id_proveedor FROM proveedor WHERE nombre = ?");
    $stmt->execute([$nombreProveedor]);
    $row = $stmt->fetch();

    if ($row) {
        return $row['id_proveedor'];
    } else {
        // Crear
        $stmtIns = $conn->prepare("INSERT INTO proveedor (nombre) VALUES (?)");
        $stmtIns->execute([$nombreProveedor]);
        return $conn->lastInsertId();
    }
}

// Solo para uso interno al leer
function getCategoriaIdByName($conn, $nombre) {
    if (!$nombre) return null;
    $stmt = $conn->prepare("SELECT id_categoria FROM categoria WHERE nombre = ?");
    $stmt->execute([$nombre]);
    $row = $stmt->fetch();
    return $row ? (int)$row['id_categoria'] : null;
}
?>