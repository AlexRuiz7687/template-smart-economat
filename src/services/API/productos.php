<?php
// ==========================================
// API PRODUCTOS - CRUD 
// ==========================================

// 1. Cabeceras CORS y Configuración
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, PATCH, DELETE");
header('Content-Type: application/json; charset=utf-8');

// Manejo de errores fatales (que no se capturan con try-catch)
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR || $error['type'] === E_COMPILE_ERROR)) {
        // Limpiar cualquier salida previa corrupta
        if (ob_get_length()) ob_clean(); 
        http_response_code(500);
        echo json_encode(["error" => "Error Fatal PHP: " . $error['message'] . " en línea " . $error['line']]);
        exit();
    }
});

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
        
        // Determinar si es JSON o FormData
        $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
        
        if (strpos($contentType, 'application/json') !== false) {
             $input = json_decode(file_get_contents('php://input'), true);
        } else {
             // Asumimos FormData
             $input = $_POST;
             
             // Decodificar Alérgenos si vienen como string JSON
             if (isset($input['alergenos']) && is_string($input['alergenos'])) {
                 $input['alergenos'] = json_decode($input['alergenos'], true);
             }
        }

        if (!isset($input['nombre']) || !isset($input['precio'])) {
            sendResponse(400, ['error' => 'Datos incompletos: nombre y precio son obligatorios']);
        }

        try {
            $conn->beginTransaction();

            // 1. Procesar Imagen si existe
            $nombreImagen = 'no-image.png'; // Default
            
            // Si viene archivo en $_FILES
            if (isset($_FILES['file_imagen']) && $_FILES['file_imagen']['error'] === UPLOAD_ERR_OK) {
                $nombreImagen = processAndSaveImage($_FILES['file_imagen']);
            } 
            // Si viene URL/nombre en input (JSON)
            elseif (isset($input['imagenUrl'])) {
                 $nombreImagen = $input['imagenUrl'];
            }

            // 2. Obtener o Crear Categoría
            $nombreCategoria = isset($input['categoria']) ? trim($input['categoria']) : 'General';
            $idCategoria = getOrCreateCategoria($conn, $nombreCategoria);

            // 3. Insertar Producto (Tabla `producto`)
            $stmtProd = $conn->prepare("INSERT INTO producto (nombre, descripcion, unidad_medida, imagen, id_categoria) VALUES (?, ?, ?, ?, ?)");
            
            // Mapeo de campos
            $nombre = $input['nombre'];
            $descripcion = isset($input['descripcion']) ? $input['descripcion'] : '';
            $unidad = isset($input['unidad']) ? $input['unidad'] : 'unidad';
            
            $stmtProd->execute([$nombre, $descripcion, $unidad, $nombreImagen, $idCategoria]);
            $idProducto = $conn->lastInsertId();

            // 4. Obtener o Crear Proveedor
            $nombreProveedor = isset($input['distribuidor']) ? trim($input['distribuidor']) : (isset($input['proveedor']) ? trim($input['proveedor']) : 'Genérico');
            $idProveedor = getOrCreateProveedor($conn, $nombreProveedor);

            // 5. Crear Relación Producto-Proveedor (Tabla `producto_proveedor`)
            $codigoRef = isset($input['id']) ? $input['id'] : ('REF-' . time());
            $precio = (float)$input['precio'];

            $stmtPP = $conn->prepare("INSERT INTO producto_proveedor (id_producto, id_proveedor, codigo_referencia, precio_unitario) VALUES (?, ?, ?, ?)");
            $stmtPP->execute([$idProducto, $idProveedor, $codigoRef, $precio]);
            $idProductoProveedor = $conn->lastInsertId();

            // 6. Crear Inventario Inicial (Tabla `inventario`)
            $stock = isset($input['stock']) ? (float)$input['stock'] : 0;
            $stockMin = isset($input['stockMinimo']) ? (float)$input['stockMinimo'] : 5;

            $stmtInv = $conn->prepare("INSERT INTO inventario (id_producto_proveedor, stock_actual, stock_minimo) VALUES (?, ?, ?)");
            $stmtInv->execute([$idProductoProveedor, $stock, $stockMin]);

            $conn->commit();

            sendResponse(201, ['message' => 'Producto creado correctamente', 'id' => $idProducto, 'imagen' => $nombreImagen]);

        } catch (Exception $e) {
            $conn->rollBack();
            // Borrar imagen subida si falló la transacción para no dejar basura? (Opcional)
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

            // Actualizar relaciones (simplificado)
            $stmtGetPP = $conn->prepare("SELECT id_producto_proveedor FROM producto_proveedor WHERE id_producto = ? LIMIT 1");
            $stmtGetPP->execute([$id]);
            $ppRow = $stmtGetPP->fetch();
            
            if ($ppRow) {
                $idPP = $ppRow['id_producto_proveedor'];

                if (isset($input['proveedor']) || isset($input['distribuidor'])) {
                     $nomProv = isset($input['proveedor']) ? $input['proveedor'] : $input['distribuidor'];
                     $idProv = getOrCreateProveedor($conn, $nomProv);
                     $updProv = $conn->prepare("UPDATE producto_proveedor SET id_proveedor = ? WHERE id_producto_proveedor = ?");
                     $updProv->execute([$idProv, $idPP]);
                }

                if (isset($input['precio'])) {
                    $updPrecio = $conn->prepare("UPDATE producto_proveedor SET precio_unitario = ? WHERE id_producto_proveedor = ?");
                    $updPrecio->execute([(float)$input['precio'], $idPP]);
                }

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
 * Procesa la subida de imagen y la convierte a WebP
 */
function processAndSaveImage($file) {
    // Corregido: Subir 3 niveles para llegar al root (API -> services -> src -> root)
    $targetDir = "../../../assets/img/productos/";
    
    // Crear carpeta si no existe
    if (!file_exists($targetDir)) {
        if (!mkdir($targetDir, 0777, true)) {
            throw new Exception("No se pudo crear el directorio de imágenes. Verifica permisos.");
        }
    }

    // Comprobar si GD está disponible
    if (!extension_loaded('gd') || !function_exists('gd_info')) {
       throw new Exception("La librería GD de PHP no está instalada o habilitada en el servidor.");
    }
    
    // Validar tipo de imagen
    $imageFileType = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $check = getimagesize($file["tmp_name"]);
    
    if ($check === false) {
        throw new Exception("El archivo no es una imagen válida.");
    }

    // Generar nombre base (la extensión se decide al guardar)
    // $newFileName = "producto_" . time() . ".webp"; // Eliminado, se define abajo
    // $targetFile = $targetDir . $newFileName;       // Eliminado, se define abajo

    // Cargar imagen según tipo
    $sourceImage = null;
    switch ($imageFileType) {
        case 'jpg':
        case 'jpeg':
            $sourceImage = imagecreatefromjpeg($file["tmp_name"]);
            break;
        case 'png':
            $sourceImage = imagecreatefrompng($file["tmp_name"]);
            // Mantener transparencia si es PNG
            imagepalettetotruecolor($sourceImage);
            imagealphablending($sourceImage, true);
            imagesavealpha($sourceImage, true);
            break;
        case 'gif':
            $sourceImage = imagecreatefromgif($file["tmp_name"]);
            break;
        case 'webp':
            $sourceImage = imagecreatefromwebp($file["tmp_name"]);
            break;
        default:
            throw new Exception("Formato de imagen no soportado. Usa JPG, PNG, GIF o WEBP.");
    }

    if (!$sourceImage) {
        throw new Exception("Error al procesar la imagen.");
    }

    // Convertir y guardar
    // Intentar WebP primero
    if (function_exists('imagewebp')) {
        $newFileName = "producto_" . time() . ".webp";
        $targetFile = $targetDir . $newFileName;
        if (imagewebp($sourceImage, $targetFile, 80)) {
            imagedestroy($sourceImage);
            return $newFileName; 
        }
    }
    
    // Fallback a JPEG si WebP no existe o falló
    $newFileName = "producto_" . time() . ".jpg";
    $targetFile = $targetDir . $newFileName;
    
    if (imagejpeg($sourceImage, $targetFile, 80)) {
        imagedestroy($sourceImage);
        return $newFileName;
    } else {
        imagedestroy($sourceImage);
        throw new Exception("Error al guardar la imagen (WebP no disponible y JPEG falló).");
    }
}

function getOrCreateCategoria($conn, $nombreCategoria) {
    if (empty($nombreCategoria)) $nombreCategoria = 'General';
    $stmt = $conn->prepare("SELECT id_categoria FROM categoria WHERE nombre = ?");
    $stmt->execute([$nombreCategoria]);
    $row = $stmt->fetch();
    if ($row) return $row['id_categoria'];
    
    $stmtIns = $conn->prepare("INSERT INTO categoria (nombre) VALUES (?)");
    $stmtIns->execute([$nombreCategoria]);
    return $conn->lastInsertId();
}

function getOrCreateProveedor($conn, $nombreProveedor) {
    if (empty($nombreProveedor)) $nombreProveedor = 'Proveedor Desconocido';
    $stmt = $conn->prepare("SELECT id_proveedor FROM proveedor WHERE nombre = ?");
    $stmt->execute([$nombreProveedor]);
    $row = $stmt->fetch();
    if ($row) return $row['id_proveedor'];
    
    $stmtIns = $conn->prepare("INSERT INTO proveedor (nombre) VALUES (?)");
    $stmtIns->execute([$nombreProveedor]);
    return $conn->lastInsertId();
}

function getCategoriaIdByName($conn, $nombre) {
    if (!$nombre) return null;
    $stmt = $conn->prepare("SELECT id_categoria FROM categoria WHERE nombre = ?");
    $stmt->execute([$nombre]);
    $row = $stmt->fetch();
    return $row ? (int)$row['id_categoria'] : null;
}
?>