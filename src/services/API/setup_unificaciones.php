<?php
require 'eco-config.php';

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "CREATE TABLE IF NOT EXISTS compra_unificada (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_items INT,
        ids_pedidos TEXT,
        detalle_snapshot JSON,
        usuario_id INT
    )";

    $conn->exec($sql);
    echo "Tabla compra_unificada creada correctamente.";

} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
