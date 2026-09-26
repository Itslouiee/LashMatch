<?php
declare(strict_types=1);
require __DIR__.'/db.php';
require __DIR__.'/studio-scope.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
ini_set('display_errors','0');
ini_set('session.use_strict_mode','1');
session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Lax','path'=>'/']);
session_start();
function respond(array $data,int $status=200): never {
    http_response_code($status); echo json_encode($data,JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit;
}
function field(array $data,string $key): string { return isset($data[$key]) && is_string($data[$key])?trim($data[$key]):''; }
function account(): ?array {
    if (empty($_SESSION['user']['id'])) return null;
    $q=database()->prepare('SELECT id,name,email,role,is_active FROM users WHERE id=?'); $q->execute([$_SESSION['user']['id']]); $u=$q->fetch();
    if (!$u || !$u['is_active']) { unset($_SESSION['user']); return null; }
    unset($u['is_active']); $u['id']=(int)$u['id']; return $_SESSION['user']=$u;
}
function requireUser(bool $admin=false): array {
    $u=account(); if (!$u) respond(['error'=>'Please log in to continue.'],401);
    if ($admin && $u['role']!=='admin') respond(['error'=>'Administrator access is required.'],403); return $u;
}
function studioRows(bool $all=false): array {
    $rows=database()->query('SELECT id,name,city,address,description,specialties,latitude,longitude,is_demo,is_active,phone,instagram,facebook,image_data,capabilities FROM studios'.($all?'':' WHERE is_active=1').' ORDER BY name')->fetchAll();
    if (!$all) $rows=array_values(array_filter($rows,fn($r)=>caviteCity($r['city'])!==null));
    foreach($rows as &$r) { $r['in_service_area']=caviteCity($r['city'])!==null;$r['city']=caviteCity($r['city'])??$r['city'];$r['id']=(int)$r['id']; $r['specialties']=json_decode($r['specialties'],true);$r['capabilities']=json_decode($r['capabilities']??'{}',true)?:[]; } return $rows;
}
function favorites(int $id): array {
    $q=database()->prepare('SELECT kind,item,UNIX_TIMESTAMP(created_at)*1000 AS saved_at FROM saved_items WHERE user_id=? ORDER BY created_at'); $q->execute([$id]);
    $available=array_column(studioRows(),'id');$availableLooks=database()->query('SELECT name FROM lash_styles WHERE is_active=1')->fetchAll(PDO::FETCH_COLUMN);
    $result=['looks'=>[],'studios'=>[],'dates'=>['looks'=>[],'studios'=>[]]];
    foreach($q as $row) { if($row['kind']==='looks'&&!in_array($row['item'],$availableLooks,true))continue; if($row['kind']==='studios' && !in_array((int)$row['item'],$available,true))continue; $item=$row['kind']==='studios'?(int)$row['item']:$row['item']; $result[$row['kind']][]=$item; $result['dates'][$row['kind']][$item]=(int)$row['saved_at']; } return $result;
}
function journey(int $id): array {
 $db=database();
 $q=$db->prepare('SELECT COUNT(*) FROM lash_matches WHERE user_id=?');$q->execute([$id]);$count=(int)$q->fetchColumn();
 $q=$db->prepare('SELECT s.name AS item, UNIX_TIMESTAMP(m.created_at)*1000 AS at FROM lash_matches m JOIN lash_styles s ON s.id=m.lash_style_id WHERE m.user_id=? ORDER BY m.id DESC LIMIT 100');$q->execute([$id]);
 $events=[];foreach($q as $row)$events[]=['type'=>'quiz','item'=>$row['item'],'at'=>(int)$row['at']];
 $q=$db->prepare('SELECT request_key, UNIX_TIMESTAMP(created_at)*1000 AS at FROM tryon_sessions WHERE user_id=? ORDER BY id DESC LIMIT 100');$q->execute([$id]);$tries=$q->fetchAll();
 foreach($tries as $row)$events[]=['type'=>'tryon','at'=>(int)$row['at']];
 usort($events,fn($a,$b)=>$b['at']<=>$a['at']);
 return ['quizCount'=>$count,'triedOn'=>count($tries)>0,'events'=>array_slice($events,0,100)];
}

function bounded(array $data,string $key,int $max,bool $required=false): string {
    $v=field($data,$key); if (($required && $v==='') || mb_strlen($v)>$max) respond(['error'=>"Enter a valid $key (up to $max characters)."],422); return $v;
}
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$action=$_GET['action'] ?? ''; $method=$_SERVER['REQUEST_METHOD'];
try {
    if ($method==='GET') {
        if ($action==='session') { $u=account(); respond(['user'=>$u,'csrf'=>$_SESSION['csrf'],'saved'=>$u?favorites($u['id']):null,'journey'=>$u?journey($u['id']):null]); }
        if ($action==='studios') respond(['studios'=>studioRows()]);
        if ($action==='catalog') respond(['styles'=>database()->query('SELECT id,name,description,type,image_data FROM lash_styles WHERE is_active=1 ORDER BY id')->fetchAll(),'rules'=>database()->query('SELECT volume,finish FROM recommendation_rules')->fetchAll()]);
        if ($action==='matches') {
            $u=requireUser(); $q=database()->prepare('SELECT m.id,m.request_key,m.eye_shape,m.finish,m.occasion,m.volume,m.experience,m.created_at,s.name AS style FROM lash_matches m JOIN lash_styles s ON s.id=m.lash_style_id WHERE m.user_id=? ORDER BY m.id DESC LIMIT 100'); $q->execute([$u['id']]); respond(['matches'=>$q->fetchAll()]);
        }
        if ($action==='admin_data') {$u=requireUser(true);require __DIR__.'/admin-data.php';respond(adminSnapshot($u));}
        respond(['error'=>'Endpoint not found.'],404);
    }
    if ($method!=='POST') { header('Allow: GET, POST'); respond(['error'=>'Method not allowed.'],405); }
    if (!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) respond(['error'=>'Your session has expired. Refresh and try again.'],403);
    $limit=in_array($action,['admin_style_save','admin_studio_save'],true)?3000000:32768;
    $raw=file_get_contents('php://input',false,null,0,$limit+1); if (strlen($raw)>$limit) respond(['error'=>'Request is too large.'],413);
    $data=json_decode($raw,true); if (!is_array($data)) respond(['error'=>'Invalid request body.'],400);
    if ($action==='logout') { $_SESSION=[]; session_regenerate_id(true); respond(['success'=>true]); }
    if ($action==='signup' || $action==='login') {
        $email=strtolower(field($data,'email')); $password=$data['password'] ?? '';
        if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>254 || !is_string($password) || strlen($password)<8 || strlen($password)>72) respond(['error'=>'Enter a valid email and a password of 8–72 bytes.'],422);
        $db=database(); $ip=hash('sha256',$_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $q=$db->prepare('SELECT COUNT(*) FROM auth_attempts WHERE ip_hash=? AND attempted_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)'); $q->execute([$ip]);
        if ((int)$q->fetchColumn()>=20) respond(['error'=>'Too many attempts. Try again in 15 minutes.'],429);
        $db->prepare('INSERT INTO auth_attempts (ip_hash) VALUES (?)')->execute([$ip]); $db->exec('DELETE FROM auth_attempts WHERE attempted_at<DATE_SUB(NOW(),INTERVAL 1 DAY)');
        if ($action==='signup') {
            $name=bounded($data,'name',100,true);
            try { $db->prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)')->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT)]); }
            catch(PDOException $e) { if ($e->getCode()==='23000') respond(['error'=>'This email is already registered. Please log in.'],409); throw $e; }
            $u=['id'=>(int)$db->lastInsertId(),'name'=>$name,'email'=>$email,'role'=>'user'];
        } else {
            $q=$db->prepare('SELECT id,name,email,password_hash,role,is_active FROM users WHERE email=?'); $q->execute([$email]); $u=$q->fetch();
            $hash=$u?$u['password_hash']:'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
            if (!password_verify($password,$hash) || !$u) respond(['error'=>'Email or password is incorrect.'],401);
            if (!$u['is_active']) respond(['error'=>'This account has been deactivated. Contact your administrator.'],403);
            if (field($data,'role')==='admin' && $u['role']!=='admin') respond(['error'=>'This account does not have administrator access. Select User to sign in.'],403);
            unset($u['password_hash'],$u['is_active']); $u['id']=(int)$u['id'];
        }
        session_regenerate_id(true); $_SESSION['user']=$u; $_SESSION['csrf']=bin2hex(random_bytes(32)); respond(['user'=>$u,'csrf'=>$_SESSION['csrf']],$action==='signup'?201:200);
    }
    if ($action==='record_tryon') {
        $u=requireUser();$key=field($data,'request_key');
        if(!preg_match('/^[a-zA-Z0-9-]{8,64}$/D',$key))respond(['error'=>'Invalid try-on request.'],422);
        database()->prepare('INSERT IGNORE INTO tryon_sessions (user_id,request_key) VALUES (?,?)')->execute([$u['id'],$key]);
        respond(['journey'=>journey($u['id'])]);
    }
    if ($action==='save_match') {
        $u=requireUser(); $db=database(); $shape=field($data,'eye_shape'); $finish=field($data,'finish'); $occasion=field($data,'occasion'); $volume=field($data,'volume'); $experience=bounded($data,'experience',30);
        if ($volume!=='') { $q=$db->prepare('SELECT finish FROM recommendation_rules WHERE volume=?'); $q->execute([$volume]); $finish=$q->fetchColumn(); }
        $names=['natural'=>'Classic','balanced'=>'Hybrid','textured'=>'Wispy','dramatic'=>'Volume'];
        if (!in_array($shape,['almond','round','hooded','monolid','unsure'],true) || !isset($names[$finish]) || !in_array($occasion,['everyday','event'],true)) respond(['error'=>'Please select valid quiz answers.'],422);
        $key=field($data,'request_key'); if ($key!=='' && !preg_match('/^[a-zA-Z0-9-]{8,64}$/D',$key)) respond(['error'=>'Invalid quiz request.'],422);
        if ($key!=='') { $q=$db->prepare('SELECT s.name AS style,m.finish,m.id FROM lash_matches m JOIN lash_styles s ON s.id=m.lash_style_id WHERE m.user_id=? AND m.request_key=?'); $q->execute([$u['id'],$key]); if ($existing=$q->fetch()) respond(['success'=>true]+$existing); }
        $q=$db->prepare('INSERT INTO lash_matches (user_id,lash_style_id,eye_shape,finish,occasion,volume,experience,request_key) SELECT ?,id,?,?,?,?,?,? FROM lash_styles WHERE name=? AND is_active=1');
        $q->execute([$u['id'],$shape,$finish,$occasion,$volume?:null,$experience?:null,$key?:null,$names[$finish]]);
        if ($q->rowCount()!==1) respond(['error'=>'The recommended style is unavailable. Contact your administrator.'],503);
        respond(['success'=>true,'id'=>(int)$db->lastInsertId(),'style'=>$names[$finish],'finish'=>$finish],201);
    }
    if ($action==='save_favorites') {
        $u=requireUser(); $kind=field($data,'kind'); $items=$data['items'] ?? null;
        if (!in_array($kind,['looks','studios'],true) || !is_array($items) || count($items)>200) respond(['error'=>'Invalid saved items.'],422);
        foreach($items as $item) if (!is_string($item) && !is_int($item)) respond(['error'=>'Invalid saved item.'],422);
        $items=array_values(array_unique(array_map('strval',$items)));
        $allowed=$kind==='looks'?database()->query('SELECT name FROM lash_styles WHERE is_active=1')->fetchAll(PDO::FETCH_COLUMN):array_column(studioRows(),'id');
        if (array_diff($items,array_map('strval',$allowed))) respond(['error'=>'A saved item is no longer available. Refresh and try again.'],422);
        $db=database(); $db->beginTransaction(); $q=$db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE'); $q->execute([$u['id']]);
        $q=$db->prepare('SELECT item FROM saved_items WHERE user_id=? AND kind=?'); $q->execute([$u['id'],$kind]);
        foreach($q->fetchAll(PDO::FETCH_COLUMN) as $old) if (!in_array($old,$items,true)) $db->prepare('DELETE FROM saved_items WHERE user_id=? AND kind=? AND item=?')->execute([$u['id'],$kind,$old]);
        $q=$db->prepare('INSERT IGNORE INTO saved_items (user_id,kind,item) VALUES (?,?,?)'); foreach($items as $item) $q->execute([$u['id'],$kind,$item]);
        $db->commit(); respond(['saved'=>favorites($u['id'])]);
    }
    if (str_starts_with($action,'admin_')) { require __DIR__.'/admin-api.php'; }
    respond(['error'=>'Endpoint not found.'],404);
} catch(PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('LashMatch database error: '.$e->getMessage()); respond(['error'=>'Database request failed. Check MySQL and run migrate.php if this is a new installation.'],503);
} catch(Throwable $e) { error_log('LashMatch error: '.$e->getMessage()); respond(['error'=>'Something went wrong. Please try again.'],500); }
