<?php
// backend/config.php

$host = 'localhost';
$dbname = 'expense_tracker';
$username = 'root';
$password = ''; // Default XAMPP password is empty

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Return PDO connection (implicitly available to files that require this script)
    
} catch(PDOException $e) {
    // If the backend fails to connect, output JSON error to handle gracefully on the frontend
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}
?>
