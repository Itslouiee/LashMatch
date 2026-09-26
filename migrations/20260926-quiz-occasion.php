<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/db.php';
$db=database();
$db->exec("ALTER TABLE lash_matches MODIFY occasion ENUM('everyday','event','travel','night') NOT NULL");
echo "Quiz occasion choices updated. Existing results preserved.\n";
