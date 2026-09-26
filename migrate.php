<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__.'/db.php';
$db = database();
function addColumn(PDO $db, string $table, string $column, string $definition): void {
    $q = $db->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?');
    $q->execute([$table, $column]);
    if (!$q->fetchColumn()) $db->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
}
addColumn($db, 'users', 'role', "ENUM('user','admin') NOT NULL DEFAULT 'user'");
addColumn($db, 'users', 'is_active', 'BOOLEAN NOT NULL DEFAULT TRUE');
addColumn($db, 'studios', 'is_active', 'BOOLEAN NOT NULL DEFAULT TRUE');
addColumn($db, 'studios', 'phone', "VARCHAR(50) NOT NULL DEFAULT ''");
addColumn($db, 'studios', 'instagram', "VARCHAR(150) NOT NULL DEFAULT ''");
addColumn($db, 'studios', 'facebook', "VARCHAR(150) NOT NULL DEFAULT ''");
addColumn($db, 'lash_matches', 'request_key', 'VARCHAR(64) DEFAULT NULL');
addColumn($db, 'lash_matches', 'volume', 'VARCHAR(20) DEFAULT NULL');
addColumn($db, 'lash_matches', 'experience', 'VARCHAR(30) DEFAULT NULL');
$index = $db->query("SHOW INDEX FROM lash_matches WHERE Key_name='idx_match_request'")->fetch();
if (!$index) $db->exec('CREATE UNIQUE INDEX idx_match_request ON lash_matches (user_id,request_key)');
$db->exec("CREATE TABLE IF NOT EXISTS recommendation_rules (volume VARCHAR(20) PRIMARY KEY, finish ENUM('natural','balanced','textured','dramatic') NOT NULL) ENGINE=InnoDB");
$db->exec("INSERT IGNORE INTO recommendation_rules (volume,finish) VALUES ('light','natural'),('medium','balanced'),('full','dramatic'),('mega','dramatic')");
$db->exec("CREATE TABLE IF NOT EXISTS saved_items (user_id BIGINT UNSIGNED NOT NULL, kind ENUM('looks','studios') NOT NULL, item VARCHAR(100) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,kind,item), CONSTRAINT fk_saved_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB");
$db->exec("CREATE TABLE IF NOT EXISTS app_settings (setting_key VARCHAR(100) PRIMARY KEY, value TEXT NOT NULL) ENGINE=InnoDB");
$db->exec("CREATE TABLE IF NOT EXISTS tryon_sessions (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, request_key VARCHAR(64) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY idx_tryon_request(user_id,request_key), CONSTRAINT fk_tryon_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB");
addColumn($db,'lash_styles','type',"VARCHAR(30) NOT NULL DEFAULT 'Classic'");
addColumn($db,'lash_styles','is_active','BOOLEAN NOT NULL DEFAULT TRUE');
addColumn($db,'lash_styles','image_data','MEDIUMTEXT DEFAULT NULL');
$db->exec("UPDATE lash_styles SET type=name WHERE name IN ('Classic','Hybrid','Wispy','Volume')");
addColumn($db,'studios','image_data','MEDIUMTEXT DEFAULT NULL');
addColumn($db,'studios','capabilities','TEXT DEFAULT NULL');
echo "LashMatch migration complete. Existing accounts and results preserved.\n";
