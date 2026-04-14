<?php
// backend/getIncome.php

header('Content-Type: application/json');

require_once 'config.php';
require_once 'auth_check.php';

$month = $_GET['month'] ?? '';
$month = trim($month);

if (empty($month)) {
    echo json_encode(["status" => "error", "message" => "Month parameter is required."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT amount FROM income WHERE user_id = :user_id AND month = :month LIMIT 1");
    $stmt->execute([
        ':user_id' => $user_id,
        ':month' => $month
    ]);

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // If no income is set for this month, default to 0
    $amount = $result ? (float)$result['amount'] : 0.00;

    echo json_encode([
        "status" => "success", 
        "income" => $amount
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
