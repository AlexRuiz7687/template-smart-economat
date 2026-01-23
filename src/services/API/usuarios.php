<?php
// 1. Cabeceras
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
if($method == "OPTIONS") {
    die();
}

// 2. Configuración
require 'eco-config.php';

try {
    // 3. Conexión
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    /* $pdo->exec("SET lc_messages = 'es_ES';"); */
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    

    // 4. Lógica según método HTTP
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // --- LOGIN (POST) ---
        // Leemos el JSON de entrada
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        $inputUser = $data['username'] ?? '';
        $inputPass = $data['password'] ?? '';

        // Query segura buscando por usuario y contraseña
        $sql = "SELECT * FROM usuario WHERE username = :username AND password = :password LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':username', $inputUser);
        $stmt->bindParam(':password', $inputPass);
        $stmt->execute();

        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Usuario encontrado -> Devolvemos objeto Usuario (sin password)
             $userNombre      = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['nombre']);
             $userUsername    = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['username']);
             $userRol         = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['rol']);
             $userApellidos   = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['apellidos']);
             $userEmail       = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['email']);
             $userTelefono    = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['telefono']);
             $userId          = (int)$row['id_usuario'];

             echo '{';
             echo '"success": true,';
             echo '"user": {';
             echo '"id": ' . $userId . ','; 
             echo '"username": "' . $userUsername . '",';
             echo '"nombre": "' . $userNombre . '",';
             echo '"apellidos": "' . $userApellidos . '",';
             echo '"email": "' . $userEmail . '",';
             echo '"telefono": "' . $userTelefono . '",';
             echo '"rol": "' . $userRol . '"';
             echo '}';
             echo '}';
        } else {
            // Usuario no encontrado
             echo '{ "success": false, "message": "Usuario o contraseña incorrectos" }';
        }

    } else {
        // --- LISTAR TODOS (GET) ---
        // Mantenemos la lógica anterior para GET (Listar todos)
        // (Útil para admin, aunque idealmente debería protegerse también)

        $sqlUsuario = " SELECT * FROM usuario";
        $stmt = $conn->prepare($sqlUsuario);
        $stmt->execute();

        echo "["; 
        $primero = true;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($primero) { $primero = false; } else { echo ","; }

            $userNombre      = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['nombre']);
            $userUsername    = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['username']);
            $userRol         = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['rol']);
            $userApellidos   = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['apellidos']);
            $userEmail       = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['email']);
            $userTelefono    = str_replace(['"', "\r", "\n"], ['\"', '', ''], $row['telefono']);
            $userId          = (int)$row['id_usuario'];
            
            echo '{';
            echo '"id": ' . $userId . ','; 
            echo '"username": "' . $userUsername . '",';
            echo '"nombre": "' . $userNombre . '",';
            echo '"apellidos": "' . $userApellidos . '",';
            echo '"email": "' . $userEmail . '",';
            echo '"telefono": "' . $userTelefono . '",';
            echo '"rol": "' . $userRol . '"';
            echo '}';
        }
        echo "]";
    }

} catch(PDOException $e) {
    http_response_code(500);
    // 
    echo '{ "error": "Error en la base de datos: ' . str_replace('"', '\"', $e->getMessage()) . '" }';
}

$conn = null;
?>