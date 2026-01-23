<?php
// ==========================================
// API PEDIDOS - CRUD COMPLETO
// ==========================================

// 1. Cabeceras CORS
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
    // GET: LEER PEDIDOS
    // ==========================================
    if ($method === 'GET') {
        
        $id = isset($_GET['id']) ? filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) : null;

        if ($id) {
            // --- DETALLE DE UN PEDIDO ---
            // 1. Cabecera (usamos vista_pedidos para tener nombres resueltos)
            $stmt = $conn->prepare("SELECT * FROM vista_pedidos WHERE id_pedido = ?");
            $stmt->execute([$id]);
            $pedido = $stmt->fetch();

            if (!$pedido) {
                sendResponse(404, ['error' => 'Pedido no encontrado']);
            }

            // 2. Líneas
            // Hacemos JOIN con producto_proveedor y producto para sacar nombres
            $sqlLines = "
                SELECT 
                    lp.id_linea_pedido,
                    lp.cantidad,
                    lp.precio_momento as precio,
                    lp.subtotal,
                    lp.id_producto_proveedor, -- Necesario para editar
                    p.id_producto, -- Necesario para editar
                    p.nombre as producto,
                    prov.nombre as proveedor
                FROM linea_pedido lp
                JOIN producto_proveedor pp ON lp.id_producto_proveedor = pp.id_producto_proveedor
                JOIN producto p ON pp.id_producto = p.id_producto
                JOIN proveedor prov ON pp.id_proveedor = prov.id_proveedor
                WHERE lp.id_pedido = ?
            ";
            $stmtLines = $conn->prepare($sqlLines);
            $stmtLines->execute([$id]);
            $lineas = $stmtLines->fetchAll();

            // Formateo numérico
            $pedido['id'] = (int)$pedido['id_pedido'];
            $pedido['total'] = (float)$pedido['total'];
            $pedido['lineas'] = array_map(function($l) {
                return [
                    'id' => (int)$l['id_linea_pedido'],
                    'cantidad' => (float)$l['cantidad'],
                    'precio' => (float)$l['precio'],
                    'subtotal' => (float)$l['subtotal'],
                    'producto' => $l['producto'],
                    'proveedor' => $l['proveedor'],
                    'productoId' => (int)$l['id_producto'], // Para compatibilidad frontend
                    'id_producto_proveedor' => (int)$l['id_producto_proveedor']
                ];
            }, $lineas);

            echo json_encode($pedido);

        } else {
            // --- LISTADO RESUMEN ---
            $stmt = $conn->prepare("SELECT * FROM vista_pedidos ORDER BY fecha DESC");
            $stmt->execute();
            $pedidos = $stmt->fetchAll();

            // Casting
            $data = array_map(function($row) {
                return [
                    'id' => (int)$row['id_pedido'],
                    'solicitante' => $row['solicitante'],
                    'fecha' => $row['fecha'],
                    'estado' => $row['estado'],
                    'total' => (float)$row['total']
                ];
            }, $pedidos);

            echo json_encode($data);
        }
    }

    // ==========================================
    // POST: CREAR PEDIDO
    // ==========================================
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id_usuario']) && !isset($input['usuarioId'])) {
            sendResponse(400, ['error' => 'Usuario requerido (id_usuario/usuarioId)']);
        }

        $idUsuario = isset($input['id_usuario']) ? $input['id_usuario'] : $input['usuarioId'];
        $lineas = isset($input['lines']) ? $input['lines'] : (isset($input['detalles']) ? $input['detalles'] : []);

        if (empty($lineas) || !is_array($lineas)) {
            sendResponse(400, ['error' => 'Líneas/Detalles requeridos']);
        }

        try {
            $conn->beginTransaction();

            // 1. Crear Cabecera
            // Regla de negocio: Fecha entrega = Fecha solicitud + 9 días
            $fechaEntrega = date('Y-m-d', strtotime('+9 days'));
            
            $stmtPed = $conn->prepare("INSERT INTO pedido (id_usuario, estado, total, fecha_entrega) VALUES (?, 'pendiente', 0, ?)");
            $stmtPed->execute([$idUsuario, $fechaEntrega]);
            $idPedido = $conn->lastInsertId();

            $totalPedido = 0;

            // 2. Procesar Líneas
            $stmtLinea = $conn->prepare("INSERT INTO linea_pedido (id_pedido, id_producto_proveedor, cantidad, precio_momento) VALUES (?, ?, ?, ?)");
            
            // Preparamos consulta para obtener precio actual
            // NOTA: El frontend manda 'productoId'. Asumimos que es 'id_producto_proveedor' O si es 'id_producto' debemos resolverlo.
            // En `vista_articulos`, el id devuelto suele ser el producto_proveedor si se usa para el carrito.
            // Si el frontend usa listaProductosGlobal (que viene de getProductosCompleto), ahí:
            // id: p.id, productoId: p.id
            // En `productos.php`, GET devuelve (int)$row['id_producto'].
            // PERO `vista_articulos` (usada en GET productos.php) devuelve: `p.id_producto` como id principal?
            // Revisa `vista_articulos`. `id_producto` y `id_producto_proveedor` están ambos.
            // En `pedidosController.js`, `agregarLineaDOM` usa `prodId`.
            // Si el usuario selecciona de un combo donde el valor es ¿`id_producto` o `id_producto_proveedor`?
            // getProductosCompleto devuelve id_producto.
            // ERROR: Si insertamos `id_producto` en `linea_pedido.id_producto_proveedor`, fallará FK o lógica.
            // SOLUCIÓN: Buscar el id_producto_proveedor dado el id_producto.
            
            // Query para resolver id_producto_proveedor desde id_producto (asumiendo 1 prov principal)
            $stmtResolver = $conn->prepare("SELECT id_producto_proveedor, precio_unitario FROM producto_proveedor WHERE id_producto = ? LIMIT 1");
            
            // Query directa si ya tenemos id_producto_proveedor
            $stmtPrecio = $conn->prepare("SELECT precio_unitario FROM producto_proveedor WHERE id_producto_proveedor = ?");

            foreach ($lineas as $line) {
                // Soportar ambas nomenclaturas
                $idProdInput = isset($line['id_producto_proveedor']) ? $line['id_producto_proveedor'] : (isset($line['productoId']) ? $line['productoId'] : null);
                $cant = isset($line['cantidad']) ? (float)$line['cantidad'] : 0;

                if(!$idProdInput) continue;

                // Intentamos tratarlo como id_producto primero si viene del controller
                // El controller usa `getProductosCompleto` que devuelve `id: p.id_producto`.
                // Por tanto, $idProdInput es `id_producto`.
                // Necesitamos buscar el `id_producto_proveedor`.
                
                $stmtResolver->execute([$idProdInput]);
                $rowPP = $stmtResolver->fetch();
                
                if ($rowPP) {
                     $idPP = $rowPP['id_producto_proveedor'];
                     $precio = (float)$rowPP['precio_unitario'];
                } else {
                     // Quizás enviaron directamente el ID PP? Intentamos verificar
                     $stmtPrecio->execute([$idProdInput]);
                     $rowDirect = $stmtPrecio->fetch();
                     if($rowDirect) {
                         $idPP = $idProdInput;
                         $precio = (float)$rowDirect['precio_unitario'];
                     } else {
                         // No encontrado
                         throw new Exception("Producto ID $idProdInput no encontrado (ni como Prod ni como PP)");
                     }
                }

                $subtotal = $cant * $precio;
                $totalPedido += $subtotal;

                // Insertar línea
                $stmtLinea->execute([$idPedido, $idPP, $cant, $precio]);
            }

            // 3. Actualizar Total en Pedido
            $stmtUpdate = $conn->prepare("UPDATE pedido SET total = ? WHERE id_pedido = ?");
            $stmtUpdate->execute([$totalPedido, $idPedido]);

            $conn->commit();

            sendResponse(201, ['message' => 'Pedido creado', 'id' => $idPedido, 'total' => $totalPedido]);

        } catch (Exception $e) {
            $conn->rollBack();
            sendResponse(500, ['error' => 'Error creando pedido: ' . $e->getMessage()]);
        }
    }

    // ==========================================
    // PATCH: ACTUALIZAR ESTADO
    // ==========================================
    elseif ($method === 'PATCH' || $method === 'PUT') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$id) sendResponse(400, ['error' => 'ID requerido']);

        $fields = [];
        $params = [];

        if (isset($input['estado'])) {
             // Validar estados permitidos
             $estadosValidos = ['pendiente', 'aprobado', 'recibido', 'cancelado'];
             if (!in_array($input['estado'], $estadosValidos)) {
                 sendResponse(400, ['error' => 'Estado no válido']);
             }
             $fields[] = "estado = ?";
             $params[] = $input['estado'];
        }
        
        if (isset($input['fecha_entrega'])) {
            $fields[] = "fecha_entrega = ?";
            $params[] = $input['fecha_entrega'];
        }

        if (empty($fields)) sendResponse(400, ['error' => 'Nada que actualizar']);

        $sql = "UPDATE pedido SET " . implode(", ", $fields) . " WHERE id_pedido = ?";
        $params[] = $id;

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        sendResponse(200, ['message' => 'Pedido actualizado']);
    }

    // ==========================================
    // DELETE: ELIMINAR PEDIDO
    // ==========================================
    elseif ($method === 'DELETE') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) sendResponse(400, ['error' => 'ID requerido']);

        try {
            // ON DELETE CASCADE borra líneas
            $stmt = $conn->prepare("DELETE FROM pedido WHERE id_pedido = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                sendResponse(200, ['message' => 'Pedido eliminado']);
            } else {
                sendResponse(404, ['error' => 'Pedido no encontrado']);
            }
        } catch (Exception $e) {
            sendResponse(500, ['error' => 'Error al eliminar: ' . $e->getMessage()]);
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
