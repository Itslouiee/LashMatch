<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__.'/db.php';
$db=database();
if ($db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn()) { echo "An administrator already exists. Use the Admin option on login.html.\n"; exit; }
$token=bin2hex(random_bytes(32));
$value=json_encode(['hash'=>hash('sha256',$token),'expires'=>time()+86400]);
$db->prepare("INSERT INTO app_settings (setting_key,value) VALUES ('admin_setup',?) ON DUPLICATE KEY UPDATE value=VALUES(value)")->execute([$value]);
echo "http://localhost:8080/setup-admin.php?token=$token\n";
