<?php

session_start();
// backend/login.php
// Start the session at the very beginning
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
    // Prepare SQL to find the user
    $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify user exists and password is correct
    if ($user && password_verify($password, $user['password'])) {
        
        // Store user details in session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        echo json_encode(["status" => "success", "message" => "Login successful."]);
    } else {
        // Invalid credentials
        echo json_encode(["status" => "error", "message" => "Invalid username or password."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
