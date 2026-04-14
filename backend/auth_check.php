<?php
// backend/auth_check.php

// Ensure session is started only once
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized. Please log in first."]);
    exit();
}

// Optional: You can make the user ID available in a local variable for scripts that include this
$user_id = $_SESSION['user_id'];
?>
