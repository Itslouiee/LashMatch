<?php
declare(strict_types=1);
if (!function_exists('requireUser')) { http_response_code(404); exit; }
$u=requireUser(true); $db=database();
if ($action==='admin_user_status') {
    $id=filter_var($data['id'] ?? null,FILTER_VALIDATE_INT); $active=$data['is_active'] ?? null;
    if (!$id || $id<1 || !is_bool($active)) respond(['error'=>'Invalid account status.'],422);
    $q=$db->prepare('SELECT role FROM users WHERE id=?');$q->execute([$id]);$role=$q->fetchColumn();
    if($role===false)respond(['error'=>'Account not found.'],404);if($role!=='user')respond(['error'=>'Only client accounts can be deactivated here.'],422);
    $q=$db->prepare("UPDATE users SET is_active=? WHERE id=? AND role='user'"); $q->execute([(int)$active,$id]); respond(['success'=>true]);
}
require __DIR__.'/admin-catalog.php';
if ($action==='admin_studio_save') {
    $id=isset($data['id'])?filter_var($data['id'],FILTER_VALIDATE_INT):null;
    if (isset($data['id']) && (!$id || $id<1)) respond(['error'=>'Invalid studio.'],422);
    $name=bounded($data,'name',150,true); $city=bounded($data,'city',100,true); $address=bounded($data,'address',255); $description=bounded($data,'description',4000);
    $city=caviteCity($city);if($city===null)respond(['error'=>'Choose a city or municipality in Cavite.'],422);
    $specialties=$data['specialties'] ?? []; $allowed=$db->query('SELECT name FROM lash_styles')->fetchAll(PDO::FETCH_COLUMN);
    if (!is_array($specialties) || count($specialties)>30) respond(['error'=>'Select valid studio services.'],422);
    foreach($specialties as $s) if (!is_string($s) || !in_array($s,$allowed,true)) respond(['error'=>'Select valid studio services.'],422);
    $coordinates=[];
    foreach(['latitude'=>90,'longitude'=>180] as $key=>$max) { $v=$data[$key] ?? null; if ($v==='' || $v===null) $coordinates[]=null; elseif (!is_numeric($v) || abs((float)$v)>$max) respond(['error'=>"Invalid $key."],422); else $coordinates[]=(float)$v; }
    if (($coordinates[0]===null)!==($coordinates[1]===null)) respond(['error'=>'Enter both latitude and longitude, or leave both empty.'],422);
    foreach(['is_active','is_demo'] as $flag) if (!is_bool($data[$flag] ?? null)) respond(['error'=>'Select a valid studio status.'],422);
    $image=adminImage($data['image_data']??null);
    $values=[$name,$city,$address,$description,json_encode(array_values(array_unique($specialties))),...$coordinates,(int)$data['is_active'],(int)$data['is_demo'],bounded($data,'phone',50),bounded($data,'instagram',150),bounded($data,'facebook',150)];
    if ($id) { $q=$db->prepare('SELECT id FROM studios WHERE id=?'); $q->execute([$id]); if (!$q->fetch()) respond(['error'=>'Studio not found.'],404); $db->prepare('UPDATE studios SET name=?,city=?,address=?,description=?,specialties=?,latitude=?,longitude=?,is_active=?,is_demo=?,phone=?,instagram=?,facebook=? WHERE id=?')->execute([...$values,$id]); }
    else { $db->prepare('INSERT INTO studios (name,city,address,description,specialties,latitude,longitude,is_active,is_demo,phone,instagram,facebook,slug) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([...$values,'studio-'.bin2hex(random_bytes(10))]); $id=(int)$db->lastInsertId(); }
    if(array_key_exists('image_data',$data))$db->prepare('UPDATE studios SET image_data=? WHERE id=?')->execute([$image,$id]);
    respond(['success'=>true,'id'=>$id]);
}
if ($action==='admin_rules_save') {
    try{if(!is_array($data['rules']??null))throw new InvalidArgumentException('Provide valid rules.');saveRecommendationRules($db,$data['rules']);}catch(InvalidArgumentException $e){respond(['error'=>$e->getMessage()],422);}respond(['success'=>true]);
}
if ($action==='admin_quiz_scores_save') {
    try{if(!is_array($data['scores']??null))throw new InvalidArgumentException('Provide lash style points.');saveQuizScores($db,field($data,'key'),$data['scores']);}catch(InvalidArgumentException $e){respond(['error'=>$e->getMessage()],422);}respond(['success'=>true]);
}
if ($action==='admin_profile_save') {
    $name=bounded($data,'name',100,true); $db->prepare('UPDATE users SET name=? WHERE id=?')->execute([$name,$u['id']]); respond(['success'=>true]);
}
