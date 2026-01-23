<?php
// ==========================================
// API UNIFICACIONES - HISTORIAL DE COMPRAS
// ==========================================

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
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

    // GET: Listar historial o ver detalle
    if ($method === 'GET') {
        $id = isset($_GET['id']) ? filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) : null;

        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM compra_unificada WHERE id = ?");
            $stmt->execute([$id]);
            $compra = $stmt->fetch();
            
            if ($compra) {
                // Decodificar JSON
                $compra['detalle_snapshot'] = json_decode($compra['detalle_snapshot'], true);
                echo json_encode($compra);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'No encontrado']);
            }
        } else {
            $stmt = $conn->prepare("SELECT id, fecha, total_items, ids_pedidos FROM compra_unificada ORDER BY fecha DESC");
            $stmt->execute();
            $lista = $stmt->fetchAll();
            echo json_encode($lista);
        }
    }

    // POST: Guardar nueva unificación
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['total_items']) || !isset($input['ids_pedidos']) || !isset($input['detalle_snapshot'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan datos']);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO compra_unificada (total_items, ids_pedidos, detalle_snapshot, usuario_id) VALUES (?, ?, ?, ?)");
        
        // Guardamos JSON
        $jsonDetalle = json_encode($input['detalle_snapshot'], JSON_UNESCAPED_UNICODE);
        // IDs pedidos como string
        $ids = is_array($input['ids_pedidos']) ? implode(',', $input['ids_pedidos']) : $input['ids_pedidos'];
        $usuarioId = isset($input['usuarioId']) ? $input['usuarioId'] : 0;

        $stmt->execute([$input['total_items'], $ids, $jsonDetalle, $usuarioId]);
        
        http_response_code(201);
        echo json_encode(['message' => 'Guardado', 'id' => $conn->lastInsertId()]);
    }

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
