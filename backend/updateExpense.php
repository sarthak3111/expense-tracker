<?php
// backend/updateExpense.php

// Ensure JSON response format
header('Content-Type: application/json');

// Include DB and Auth Check
require_once 'config.php';
require_once 'auth_check.php';

// Get the raw POST data
$input = json_decode(file_get_contents('php://input'), true);

$id = $input['id'] ?? $_POST['id'] ?? 0;
$title = $input['title'] ?? $_POST['title'] ?? '';
$amount = $input['amount'] ?? $_POST['amount'] ?? 0;
$category = $input['category'] ?? $_POST['category'] ?? '';
$date = $input['date'] ?? $_POST['date'] ?? '';

// Trim and validate
$id = (int) $id;
$title = trim($title);
$category = trim($category);
$amount = (float) $amount;

if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid Expense ID is required."]);
    exit();
}

if (empty($title) || empty($category) || empty($date)) {
    echo json_encode(["status" => "error", "message" => "All fields are required."]);
    exit();
}

if ($amount <= 0) {
    echo json_encode(["status" => "error", "message" => "Amount must be greater than zero."]);
    exit();
}

try {
    // Note: $user_id is available from auth_check.php
    // We strictly use user_id in the WHERE clause to ensure users can only update their own expenses
    $stmt = $pdo->prepare("UPDATE expenses SET title = :title, amount = :amount, category = :category, date = :date WHERE id = :id AND user_id = :user_id");
    
    $stmt->execute([
        ':title' => $title,
        ':amount' => $amount,
        ':category' => $category,
        ':date' => $date,
        ':id' => $id,
        ':user_id' => $user_id
    ]);

    // Check if any row was actually updated (meaning the ID existed AND belonged to the user)
    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Expense updated successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Expense not found or you do not have permission to update it."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
