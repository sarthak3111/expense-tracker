<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Not logged in"
    ]);
    exit;
}

// THIS LINE IS CRITICAL
$user_id = $_SESSION['user_id'];