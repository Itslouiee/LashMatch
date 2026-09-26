<?php
declare(strict_types=1);
function database(): PDO {
    static $db;
    if ($db instanceof PDO) return $db;
    $c = require __DIR__.'/config.php';
    $db = new PDO("mysql:host={$c['host']};port={$c['port']};dbname={$c['database']};charset=utf8mb4", $c['username'], $c['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false]);
    return $db;
}
