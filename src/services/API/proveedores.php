<?php
// ==========================================
// API PROVEEDORES - CRUD 
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
    // GET: LEER PROVEEDORES
    // ==========================================
    if ($method === 'GET') {
        
        // ¿Solicitan un solo proveedor por ID?
        if (isset($_GET['id'])) {
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                sendResponse(400, ['error' => 'ID inválido']);
            }

            $stmt = $conn->prepare("SELECT * FROM proveedor WHERE id_proveedor = ?");
            $stmt->execute([$id]);
            $proveedor = $stmt->fetch();

            if ($proveedor) {
                // Casting de tipos si fuera necesario
                $proveedor['id'] = (int)$proveedor['id_proveedor'];
                echo json_encode($proveedor);
            } else {
                sendResponse(404, ['error' => 'Proveedor no encontrado']);
            }

        } else {
            // Listado completo
            $stmt = $conn->prepare("SELECT * FROM proveedor");
            $stmt->execute();
            $resultados = $stmt->fetchAll();

            $proveedores = array_map(function($row) {
                return [
                    'id'        => (int)$row['id_proveedor'],
                    'nombre'    => $row['nombre'],
                    'contacto'  => $row['contacto'],
                    'telefono'  => $row['telefono'],
                    'email'     => $row['email'],
                    'direccion' => $row['direccion']
                ];
            }, $resultados);

            echo json_encode($proveedores);
        }
    }

    // ==========================================
    // POST: CREAR PROVEEDOR
    // ==========================================
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['nombre'])) {
            sendResponse(400, ['error' => 'El nombre es obligatorio']);
        }

        try {
            $stmt = $conn->prepare("INSERT INTO proveedor (nombre, contacto, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)");
            
            $nombre = trim($input['nombre']);
            $contacto = isset($input['contacto']) ? trim($input['contacto']) : null;
            $telefono = isset($input['telefono']) ? trim($input['telefono']) : null;
            $email = isset($input['email']) ? trim($input['email']) : null;
            $direccion = isset($input['direccion']) ? trim($input['direccion']) : null;

            $stmt->execute([$nombre, $contacto, $telefono, $email, $direccion]);
            $idNuevo = $conn->lastInsertId();

            sendResponse(201, ['message' => 'Proveedor creado correctamente', 'id' => $idNuevo]);

        } catch (Exception $e) {
            // Manejo de duplicados u otros errores SQL
            if ($e->getCode() == 23000) { 
                sendResponse(409, ['error' => 'Ya existe un proveedor con ese nombre o datos únicos']);
            }
            throw $e;
        }
    }

    // ==========================================
    // PATCH/PUT: ACTUALIZAR PROVEEDOR
    // ==========================================
    elseif ($method === 'PATCH' || $method === 'PUT') {
        $id = isset($_GET['id']) ? filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) : null;
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$id) {
            sendResponse(400, ['error' => 'ID de proveedor requerido']);
        }

        $fieldsToUpdate = [];
        $params = [];

        if (isset($input['nombre'])) {
            $fieldsToUpdate[] = "nombre = ?";
            $params[] = trim($input['nombre']);
        }
        if (isset($input['contacto'])) {
            $fieldsToUpdate[] = "contacto = ?";
            $params[] = trim($input['contacto']);
        }
        if (isset($input['telefono'])) {
            $fieldsToUpdate[] = "telefono = ?";
            $params[] = trim($input['telefono']);
        }
        if (isset($input['email'])) {
            $fieldsToUpdate[] = "email = ?";
            $params[] = trim($input['email']);
        }
        if (isset($input['direccion'])) {
            $fieldsToUpdate[] = "direccion = ?";
            $params[] = trim($input['direccion']);
        }

        if (empty($fieldsToUpdate)) {
            sendResponse(400, ['error' => 'No se enviaron campos para actualizar']);
        }

        $sql = "UPDATE proveedor SET " . implode(", ", $fieldsToUpdate) . " WHERE id_proveedor = ?";
        $params[] = $id;

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            sendResponse(200, ['message' => 'Proveedor actualizado correctamente']);
        } else {
            // Puede ser que no existiera el ID o que los datos fueran idénticos
            sendResponse(200, ['message' => 'No se realizaron cambios (datos idénticos o ID no encontrado)']); 
        }
    }

    // ==========================================
    // DELETE: ELIMINAR PROVEEDOR
    // ==========================================
    elseif ($method === 'DELETE') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            sendResponse(400, ['error' => 'ID requerido']);
        }

        try {
            $stmt = $conn->prepare("DELETE FROM proveedor WHERE id_proveedor = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                sendResponse(200, ['message' => 'Proveedor eliminado']);
            } else {
                sendResponse(404, ['error' => 'Proveedor no encontrado']);
            }
        } catch (PDOException $e) {
            // Verificar si es error de integridad referencial (tiene productos asociados)
             if ($e->getCode() == 23000) {
                sendResponse(409, ['error' => 'No se puede eliminar el proveedor porque tiene productos asociados.']);
             }
             throw $e;
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
?>
