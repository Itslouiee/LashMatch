<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/db.php';$db=database();
if(($argv[1]??'')==='create'){
 $tag='browser-check-'.bin2hex(random_bytes(6));$password=bin2hex(random_bytes(12));$accounts=[];
 foreach(['admin','user'] as $role){$email=$tag.'-'.$role.'@example.com';$db->prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')->execute(['Browser Check '.$role,$email,password_hash($password,PASSWORD_DEFAULT),$role]);$accounts[$role]=['id'=>(int)$db->lastInsertId(),'email'=>$email];}
 echo json_encode(['tag'=>$tag,'password'=>$password,'accounts'=>$accounts]);
}elseif(($argv[1]??'')==='cleanup'&&preg_match('/^browser-check-[a-f0-9]{12}$/D',$argv[2]??'')){
 $tag=$argv[2];$db->prepare('DELETE FROM lash_styles WHERE name=?')->execute([$tag.' Lash']);$db->prepare('DELETE FROM users WHERE email IN (?,?)')->execute([$tag.'-admin@example.com',$tag.'-user@example.com']);
 $db->prepare('DELETE FROM studios WHERE name=?')->execute([$tag.' Studio']);echo 'Temporary browser records removed.';
}else{fwrite(STDERR,"Use create or cleanup <exact test tag>.\n");exit(1);}
