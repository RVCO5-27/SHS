<?php
require __DIR__ . '/backend/config/db.php';
$result = mysqli_query($connection, 'SELECT id, username, password_changed_at FROM admins LIMIT 5');
echo "Admins found:\n";
while($row = mysqli_fetch_assoc($result)) {
    echo "ID: {$row['id']}, Username: {$row['username']}, Password Changed: {$row['password_changed_at']}\n";
}
