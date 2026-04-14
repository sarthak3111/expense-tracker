<?php
// backend/deleteExpense.php

// Ensure JSON response format
header('Content-Type: application/json');

// Include DB and Auth Check
require_once 'config.php';
require_once 'auth_check.php';

// Get the raw POST data
$input = json_decode(file_get_contents('php://input'), true);

$id = $input['id'] ?? $_POST['id'] ?? 0;
$id = (int) $id;

if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "Valid Expense ID is required."]);
    exit();
}

try {
    // Note: $user_id is available from auth_check.php
    // We strictly use user_id in the WHERE clause to ensure users can only delete their own expenses
    $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = :id AND user_id = :user_id");
    
    $stmt->execute([
        ':id' => $id,
        ':user_id' => $user_id
    ]);

    // Check if any row was actually deleted (meaning the ID existed AND belonged to the user)
    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Expense deleted successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Expense not found or you do not have permission to delete it."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
