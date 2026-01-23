<?php
// Test Script for DB Insertion
// Run this from command line: php test_insertion.php

require 'eco-config.php';

echo "Testing connection to $dbname... \n";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connection Successful! \n";

    // Test Insert Provider
    echo "Attempting to insert dummy provider... \n";
    $stmt = $conn->prepare("INSERT INTO proveedor (nombre, contacto) VALUES (?, ?)");
    $name = "PROVEEDOR_TEST_" . time();
    $stmt->execute([$name, 'Test Contact']);
    $id = $conn->lastInsertId();
    echo "Provider Inserted with ID: $id \n";

    // Verify it exists
    $stmtCheck = $conn->prepare("SELECT * FROM proveedor WHERE id_proveedor = ?");
    $stmtCheck->execute([$id]);
    $row = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo "Verification: Found provider " . $row['nombre'] . "\n";
    } else {
        echo "Verification: FAILED to find provider! \n";
    }

    // Clean up
    $conn->exec("DELETE FROM proveedor WHERE id_proveedor = $id");
    echo "Cleaned up test provider. \n";

} catch (PDOException $e) {
    echo "PDO Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "General Error: " . $e->getMessage() . "\n";
}
?>
