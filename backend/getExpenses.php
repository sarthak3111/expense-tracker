<?php
// backend/getExpenses.php

header('Content-Type: application/json');

require_once 'config.php';
require_once 'auth_check.php';

$month = $_GET['month'] ?? '';
$month = trim($month);

if (empty($month)) {
    echo json_encode(["status" => "error", "message" => "Month parameter is required (YYYY-MM)."]);
    exit();
}

// We use LIKE with wildcard so we can match by YYYY-MM
$monthPattern = $month . '-%';

try {
    $stmt = $pdo->prepare("SELECT * FROM expenses WHERE user_id = :user_id AND date LIKE :date_pattern ORDER BY date DESC");
    $stmt->execute([
        ':user_id' => $user_id,
        ':date_pattern' => $monthPattern
    ]);
    
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast appropriately for frontend convenience
    foreach ($expenses as &$exp) {
        $exp['id'] = (int)$exp['id'];
        $exp['amount'] = (float)$exp['amount'];
    }

    echo json_encode(["status" => "success", "expenses" => $expenses]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
