<?php
// ==========================================
// API RECEPCION - Gestión de Entradas y Código de Barras
// ==========================================

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, PATCH, DELETE");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'eco-config.php';

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $method = $_SERVER['REQUEST_METHOD'];

    // ==========================================
    // GET: BUSCAR ARTÍCULO (Local o External)
    // ==========================================
    if ($method === 'GET') {
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        
        if ($action === 'check_barcode') {
            $code = isset($_GET['code']) ? trim($_GET['code']) : '';
            
            if (!$code) sendResponse(400, ['error' => 'Código de barras requerido']);

            // 1. Busqueda LOCAL
            // Buscamos en producto_proveedor por código de referencia (barcode)
            $sqlLocal = "
                SELECT 
                    p.id_producto,
                    pp.id_producto_proveedor,
                    p.nombre,
                    pp.codigo_referencia as codigo,
                    pp.precio_unitario as coste,
                    i.stock_actual
                FROM producto_proveedor pp
                JOIN producto p ON pp.id_producto = p.id_producto
                JOIN inventario i ON pp.id_producto_proveedor = i.id_producto_proveedor
                WHERE pp.codigo_referencia = ?
                LIMIT 1
            ";
            $stmt = $conn->prepare($sqlLocal);
            $stmt->execute([$code]);
            $localProd = $stmt->fetch();

            if ($localProd) {
                sendResponse(200, [
                    'found' => true,
                    'source' => 'local',
                    'data' => [
                        'id' => (int)$localProd['id_producto'],
                        'productoId' => (int)$localProd['id_producto'], // Compatibilidad
                        'nombre' => $localProd['nombre'],
                        'codigo' => $localProd['codigo'],
                        'coste' => (float)$localProd['coste'],
                        'stock' => (float)$localProd['stock_actual']
                    ]
                ]);
            }

            // 2. Busqueda EXTERNA (OpenFoodFacts)
            $offUrl = "https://es.openfoodfacts.org/api/v2/product/" . urlencode($code) . ".json";
            
            // Usamos curl para mejores opciones de timeout/error
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $offUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_USERAGENT, 'SmartEconomato/1.0');
            // Timeout rapido
            curl_setopt($ch, CURLOPT_TIMEOUT, 5); 
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200) {
                $data = json_decode($response, true);
                if (isset($data['status']) && $data['status'] === 1) {
                    $product = $data['product'];
                    sendResponse(200, [
                        'found' => true,
                        'source' => 'external',
                        'data' => [
                            'codigo' => $data['code'],
                            'nombre' => isset($product['product_name_es']) ? $product['product_name_es'] : (isset($product['product_name']) ? $product['product_name'] : 'Producto sin nombre'),
                            'imagen' => isset($product['image_url']) ? $product['image_url'] : '',
                            'marca' => isset($product['brands']) ? $product['brands'] : ''
                        ]
                    ]);
                }
            }

            // No encontrado en ningún sitio
            sendResponse(200, ['found' => false]);
        }
        else {
            sendResponse(400, ['error' => 'Acción no válida']);
        }
    }

    // ==========================================
    // POST: REGISTRAR RECEPCIÓN (Entrada Stock)
    // ==========================================
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        // Validación básica
        if (!isset($input['proveedorId']) || !isset($input['detalles'])) {
            sendResponse(400, ['error' => 'Faltan datos obligatorios (proveedor, detalles)']);
        }

        try {
            $conn->beginTransaction();

            // 1. Crear Pedido (Recepcionado)
            // Se crea directamente como 'recibido'
            $idUsuario = isset($input['usuarioId']) ? $input['usuarioId'] : 1; // Default admin si no viene
            $fecha = isset($input['fecha']) ? $input['fecha'] : date('Y-m-d H:i:s');
            $total = isset($input['total']) ? (float)$input['total'] : 0;
            $albaran = isset($input['albaran']) ? $input['albaran'] : ''; 

            // Nota: La tabla pedido tiene 'observaciones', usaremos eso para el albarán por ahora
            $observaciones = "Recepción Albarán: " . $albaran . ". " . (isset($input['observaciones']) ? $input['observaciones'] : '');

            // Insertamos fecha_entrega como NOW porque ya se recibió
            $stmtPed = $conn->prepare("INSERT INTO pedido (id_usuario, estado, total, fecha_entrega, observaciones) VALUES (?, 'recibido', ?, NOW(), ?)");
            $stmtPed->execute([$idUsuario, $total, $observaciones]);
            $idPedido = $conn->lastInsertId();

            $lineas = $input['detalles'];

            $stmtLinea = $conn->prepare("INSERT INTO linea_pedido (id_pedido, id_producto_proveedor, cantidad, precio_momento) VALUES (?, ?, ?, ?)");
            
            // Statements para Updates
            $stmtUpdStock = $conn->prepare("UPDATE inventario SET stock_actual = stock_actual + ? WHERE id_producto_proveedor = ?");
            $stmtUpdPrecio = $conn->prepare("UPDATE producto_proveedor SET precio_unitario = ? WHERE id_producto_proveedor = ?");

            // Resolver ID PP (Helper local)
            $stmtResolver = $conn->prepare("SELECT id_producto_proveedor FROM producto_proveedor WHERE id_producto = ? LIMIT 1");
            $stmtGetPP = $conn->prepare("SELECT id_producto_proveedor FROM producto_proveedor WHERE id_producto_proveedor = ?");


            foreach ($lineas as $l) {
                // Resolver IDs
                $idProdInput = isset($l['productoId']) ? $l['productoId'] : (isset($l['id']) ? $l['id'] : null);
                if (!$idProdInput) continue;

                $idPP = null;
                // Intento 1: Es ID Producto
                $stmtResolver->execute([$idProdInput]);
                $row = $stmtResolver->fetch();
                if($row) {
                    $idPP = $row['id_producto_proveedor'];
                } else {
                    // Intento 2: Es ID PP
                    $stmtGetPP->execute([$idProdInput]);
                    $row2 = $stmtGetPP->fetch();
                    if($row2) $idPP = $row2['id_producto_proveedor'];
                }

                if (!$idPP) {
                    // Si no existe, fallamos o saltamos. Mejor fallar para consistencia.
                    throw new Exception("Producto ID $idProdInput no encotrado en la BD");
                }

                $cantidad = (float)$l['cantidad'];
                $coste = isset($l['coste']) ? (float)$l['coste'] : 0; // Precio de compra unitario

                // Insertar Línea
                $stmtLinea->execute([$idPedido, $idPP, $cantidad, $coste]);

                // Actualizar Stock
                $stmtUpdStock->execute([$cantidad, $idPP]);

                // Actualizar Coste (Precio de compra) si es diferente de 0
                if ($coste > 0) {
                    $stmtUpdPrecio->execute([$coste, $idPP]);
                }
            }
            
            // Actualizar total (por si acaso el frontend mandó mal la suma, podemos recalcular, pero confiamos por ahora)
            // O podemos recalcular:
            // $stmtUpdateTotal = $conn->prepare("UPDATE pedido SET total = ... WHERE id_pedido = ?");

            $conn->commit();
            sendResponse(201, ['message' => 'Recepción registrada y stock actualizado', 'id' => $idPedido]);

        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(500, ['error' => 'Error en recepción: ' . $e->getMessage()]);
        }
    }

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error servidor: " . $e->getMessage()]);
}

function sendResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}
?>
