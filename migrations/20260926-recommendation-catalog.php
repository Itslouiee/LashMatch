<?php
// CLI-only migration; retains historical style IDs and results.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/db.php';$db=database();
if(!$db->query("SHOW COLUMNS FROM lash_styles LIKE 'is_archived'")->fetch())$db->exec('ALTER TABLE lash_styles ADD is_archived TINYINT(1) NOT NULL DEFAULT 0');
if(!$db->query("SHOW COLUMNS FROM lash_matches LIKE 'recommended_styles'")->fetch())$db->exec('ALTER TABLE lash_matches ADD recommended_styles TEXT NULL');
$db->exec('CREATE TABLE IF NOT EXISTS recommendation_rule_styles (volume VARCHAR(20) NOT NULL,style_id INT UNSIGNED NOT NULL,sort_order TINYINT UNSIGNED NOT NULL,PRIMARY KEY(volume,sort_order),UNIQUE KEY(volume,style_id),FOREIGN KEY(volume) REFERENCES recommendation_rules(volume),FOREIGN KEY(style_id) REFERENCES lash_styles(id)) ENGINE=InnoDB');
$db->beginTransaction();
$db->exec("UPDATE lash_styles SET is_archived=1,is_active=0 WHERE name IN ('Hybrid','Wispy','Volume')");
$defaults=['light'=>['Classic','Light Wispy','Mascara Lash','Kitten Lash'],'medium'=>['Hybrid Lash','Hybrid Volume','Wispy Cat Eye','Cat Eye'],'full'=>['Russian Volume','Wispy Volume','Mascara Volume','Hybrid Volume'],'mega'=>['DragLash (Mega Volume)','Russian Volume','Strip Lash','Anime Lash/Manua']];
$q=$db->prepare('INSERT INTO recommendation_rule_styles(volume,style_id,sort_order) SELECT ?,id,? FROM lash_styles WHERE name=? AND is_active=1');
foreach($defaults as $volume=>$names){$check=$db->prepare('SELECT COUNT(*) FROM recommendation_rule_styles WHERE volume=?');$check->execute([$volume]);if($check->fetchColumn())continue;foreach($names as $rank=>$name)$q->execute([$volume,$rank,$name]);}
$db->commit();echo 'Active menu styles: '.$db->query('SELECT COUNT(*) FROM lash_styles WHERE is_active=1')->fetchColumn().PHP_EOL;
