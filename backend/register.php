<?php
// backend/register.php

// Ensure JSON response format
header('Content-Type: application/json');

// Include database configuration
require_once 'config.php';

// Get the raw POST data
$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? $_POST['username'] ?? '';
$password = $input['password'] ?? $_POST['password'] ?? '';

// Trim the inputs
$username = trim($username);
$password = trim($password);

// Validate inputs
if (empty($username) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "Username and password cannot be empty."]);
    exit();
}

try {
    // Hash the password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Prepare SQL to insert user
    $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
    
    // Execute the statement
    $stmt->execute([
        ':username' => $username,
        ':password' => $hashedPassword
    ]);

    // Return success
    echo json_encode(["status" => "success", "message" => "Registration successful. You can now log in."]);

} catch (PDOException $e) {
    // Handling duplicate entry error for unique constraint (Error code 1062 in MySQL)
    // 23000 is SQLSTATE for constraint violation
    if ($e->getCode() == 23000) {
        echo json_encode(["status" => "error", "message" => "Username already exists."]);
    } else {
        // Generic error
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
}
?>
