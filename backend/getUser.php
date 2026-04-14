<?php
// backend/getUser.php

header('Content-Type: application/json');

require_once 'config.php';
require_once 'auth_check.php';

try {
    $stmt = $pdo->prepare("SELECT id, username, profile_pic FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $user_id]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(["status" => "success", "user" => $user]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
