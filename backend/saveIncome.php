<?php
// backend/saveIncome.php

header('Content-Type: application/json');

require_once 'config.php';
require_once 'auth_check.php';

$input = json_decode(file_get_contents('php://input'), true);

$month = $input['month'] ?? $_POST['month'] ?? '';
$amount = $input['amount'] ?? $_POST['amount'] ?? 0;

$month = trim($month);
$amount = (float) $amount;

if (empty($month)) {
    echo json_encode(["status" => "error", "message" => "Month is required."]);
    exit();
}

if ($amount < 0) {
    echo json_encode(["status" => "error", "message" => "Amount cannot be negative."]);
    exit();
}

try {
    // We use MySQL's ON DUPLICATE KEY UPDATE leveraging the unique constraint we set on (user_id, month)
    $stmt = $pdo->prepare("INSERT INTO income (user_id, month, amount) 
                           VALUES (:user_id, :month, :amount) 
                           ON DUPLICATE KEY UPDATE amount = VALUES(amount)");
    
    $stmt->execute([
        ':user_id' => $user_id,
        ':month' => $month,
        ':amount' => $amount
    ]);

    echo json_encode(["status" => "success", "message" => "Income saved successfully."]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
