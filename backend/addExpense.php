<?php
// backend/addExpense.php

// Ensure JSON response format
header('Content-Type: application/json');

// Include DB and Auth Check
require_once 'config.php';
require_once 'auth_check.php';

// Get the raw POST data
$input = json_decode(file_get_contents('php://input'), true);

$title = $input['title'] ?? $_POST['title'] ?? '';
$amount = $input['amount'] ?? $_POST['amount'] ?? 0;
$category = $input['category'] ?? $_POST['category'] ?? '';
$date = $input['date'] ?? $_POST['date'] ?? '';

// Trim and validate
$title = trim($title);
$category = trim($category);
$amount = (float) $amount;

if (empty($title) || empty($category) || empty($date)) {
    echo json_encode(["status" => "error", "message" => "All fields are required."]);
    exit();
}

if ($amount <= 0) {
    echo json_encode(["status" => "error", "message" => "Amount must be greater than zero."]);
    exit();
}

try {
    // Note: $user_id is successfully available here from auth_check.php
    $stmt = $pdo->prepare("INSERT INTO expenses (user_id, title, amount, category, date) VALUES (:user_id, :title, :amount, :category, :date)");
    
    $stmt->execute([
        ':user_id' => $user_id,
        ':title' => $title,
        ':amount' => $amount,
        ':category' => $category,
        ':date' => $date
    ]);

    // Fetch the inserted ID so frontend can map it efficiently
    $newId = $pdo->lastInsertId();

    echo json_encode([
        "status" => "success", 
        "message" => "Expense added successfully.",
        "expense" => [
            "id" => $newId,
            "title" => $title,
            "amount" => $amount,
            "category" => $category,
            "date" => $date
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
