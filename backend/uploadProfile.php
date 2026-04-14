<?php
// backend/uploadProfile.php

header('Content-Type: application/json');

require_once 'config.php';
require_once 'auth_check.php';

// Check if file was uploaded without errors
if (!isset($_FILES['profile_pic']) || $_FILES['profile_pic']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "message" => "Please select a valid image file to upload."]);
    exit();
}

$file = $_FILES['profile_pic'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
$mimeType = mime_content_type($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode(["status" => "error", "message" => "Only JPG and PNG files are allowed."]);
    exit();
}

// Validate file size (e.g., max 2MB)
if ($file['size'] > 2 * 1024 * 1024) {
    echo json_encode(["status" => "error", "message" => "File size exceeds 2MB limit."]);
    exit();
}

// Handle upload directory
$uploadDir = __DIR__ . '/../uploads/';
// Create directory if it doesn't exist
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique file name to avoid overwriting or caching issues
$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = 'user_' . $user_id . '_' . time() . '.' . $fileExtension;
$destination = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $destination)) {
    
    // Save relative path for the database and frontend fetching
    $dbPath = 'uploads/' . $fileName;

    try {
        // Update the users table
        $stmt = $pdo->prepare("UPDATE users SET profile_pic = :profile_pic WHERE id = :id");
        $stmt->execute([
            ':profile_pic' => $dbPath,
            ':id' => $user_id
        ]);
        
        echo json_encode([
            "status" => "success", 
            "message" => "Profile picture updated successfully.",
            "profile_pic" => $dbPath
        ]);
        
    } catch (PDOException $e) {
        // Clean up the uploaded file if database update fails
        if (file_exists($destination)) {
            unlink($destination);
        }
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Failed to move uploaded file."]);
}
?>
