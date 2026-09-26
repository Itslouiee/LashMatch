<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
try {
    $c = require __DIR__.'/config.php';
    $db = new PDO("mysql:host={$c['host']};port={$c['port']};dbname={$c['database']};charset=utf8mb4", $c['username'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    foreach (['users', 'lash_styles', 'studios', 'lash_matches', 'auth_attempts'] as $table) {
        $db->query("SELECT 1 FROM `$table` LIMIT 1");
    }
    echo "Connected to {$c['database']}. Required tables are available.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Database connection failed. Start MySQL in XAMPP and check config.php.\n".$e->getMessage()."\n");
    exit(1);
}
