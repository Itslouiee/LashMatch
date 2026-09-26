<?php
declare(strict_types=1);
if(!function_exists('requireUser')){http_response_code(404);exit;}
function adminImage(mixed $image): ?string {
 if($image===null||$image==='')return null;
 if(!is_string($image)||!preg_match('#^data:image/(png|jpeg);base64,([A-Za-z0-9+/=]+)$#D',$image,$m))respond(['error'=>'Upload a PNG or JPG image.'],422);
 $bytes=base64_decode($m[2],true);$info=$bytes===false?false:@getimagesizefromstring($bytes);
 if(!$info||strlen($bytes)>2097152||$info['mime']!=='image/'.$m[1]||$info[0]>10000||$info[1]>10000)respond(['error'=>'Choose a valid PNG or JPG up to 2 MB and 10000 pixels per side.'],422);
 return $image;
}
function coreStyle(string $name): bool {return false;}
function syncStudioStyle(PDO $db,string $oldName,?string $newName): void {
 $rows=$db->query('SELECT id,specialties FROM studios ORDER BY id FOR UPDATE')->fetchAll();
 $update=$db->prepare('UPDATE studios SET specialties=? WHERE id=?');
 foreach($rows as $row){
  $services=json_decode($row['specialties'],true);
  if(!is_array($services)||!in_array($oldName,$services,true))continue;
  $next=[];
  foreach($services as $service){
   if($service===$oldName)$service=$newName;
   if($service!==null&&!in_array($service,$next,true))$next[]=$service;
  }
  $update->execute([json_encode($next,JSON_THROW_ON_ERROR),$row['id']]);
 }
}
if($action==='admin_style_save'){
 $id=$data['id']??null;$old=null;
 if($id!==null){$id=filter_var($id,FILTER_VALIDATE_INT);if(!$id||$id<1)respond(['error'=>'Invalid style.'],422);$q=$db->prepare('SELECT * FROM lash_styles WHERE id=?');$q->execute([$id]);$old=$q->fetch();if(!$old)respond(['error'=>'Style not found.'],404);}
 $name=array_key_exists('name',$data)?bounded($data,'name',50,true):($old['name']??'');
 $type=$data['type']??($old['type']??'');
 $description=bounded($data,'description',4000,true);
 $active=$data['is_active']??($old?(bool)$old['is_active']:true);
 if(!$name||!in_array($type,['Classic','Hybrid','Wispy','Volume'],true)||!is_bool($active))respond(['error'=>'Enter a name, a supported lash type, and a valid status.'],422);
 if($old&&coreStyle($old['name'])&&($name!==$old['name']||$type!==$old['name']||!$active))respond(['error'=>'The four core quiz styles must keep their name, type, and active status. You can edit their description and image.'],422);
 if($old&&(!$active||$name!==$old['name'])){$check=$db->prepare('SELECT COUNT(*) FROM recommendation_rule_styles WHERE style_id=?');$check->execute([$id]);if($check->fetchColumn())respond(['error'=>'Update Recommendation Criteria before renaming or deactivating a linked style.'],422);}
 $image=array_key_exists('image_data',$data)?adminImage($data['image_data']):($old['image_data']??null);
 $db->beginTransaction();
 try{
  if($old)$db->prepare('UPDATE lash_styles SET name=?,type=?,description=?,is_active=?,image_data=? WHERE id=?')->execute([$name,$type,$description,(int)$active,$image,$id]);
  else{$db->prepare('INSERT INTO lash_styles (name,type,description,is_active,image_data) VALUES (?,?,?,?,?)')->execute([$name,$type,$description,(int)$active,$image]);$id=(int)$db->lastInsertId();}
 }catch(PDOException $e){if($db->inTransaction())$db->rollBack();if($e->getCode()==='23000')respond(['error'=>'A lash style with this name already exists.'],409);throw $e;}
 if($old&&$old['name']!==$name){
  $db->prepare("UPDATE saved_items SET item=? WHERE kind='looks' AND item=?")->execute([$name,$old['name']]);
  syncStudioStyle($db,$old['name'],$name);
 }
 $db->commit();
 respond(['success'=>true,'id'=>(int)$id]);
}
if($action==='admin_style_delete'){
 $id=filter_var($data['id']??null,FILTER_VALIDATE_INT);if(!$id||$id<1)respond(['error'=>'Invalid style.'],422);
 $q=$db->prepare('SELECT name FROM lash_styles WHERE id=?');$q->execute([$id]);$name=$q->fetchColumn();if($name===false)respond(['error'=>'Style not found.'],404);
 $linked=$db->prepare('SELECT COUNT(*) FROM recommendation_rule_styles WHERE style_id=?');$linked->execute([$id]);if($linked->fetchColumn())respond(['error'=>'Remove this style from Recommendation Criteria first.'],422);
 if(coreStyle($name))respond(['error'=>'Core quiz styles cannot be removed.'],422);
 $q=$db->prepare('SELECT COUNT(*) FROM lash_matches WHERE lash_style_id=?');$q->execute([$id]);if($q->fetchColumn())respond(['error'=>'This style has saved results. Set it inactive instead.'],422);
 $db->beginTransaction();syncStudioStyle($db,$name,null);$db->prepare("DELETE FROM saved_items WHERE kind='looks' AND item=?")->execute([$name]);$db->prepare('DELETE FROM lash_styles WHERE id=?')->execute([$id]);$db->commit();respond(['success'=>true]);
}
if($action==='admin_studio_status'||$action==='admin_studio_services'){
 $id=filter_var($data['id']??null,FILTER_VALIDATE_INT);if(!$id||$id<1)respond(['error'=>'Invalid studio.'],422);
 $q=$db->prepare('SELECT city FROM studios WHERE id=?');$q->execute([$id]);$studio=$q->fetch();if(!$studio)respond(['error'=>'Studio not found.'],404);
 $active=$data['is_active']??null;if(!is_bool($active))respond(['error'=>'Select a valid status.'],422);
 if($active&&caviteCity($studio['city'])===null)respond(['error'=>'Set a Cavite location before activating this studio.'],422);
 if($action==='admin_studio_services'){
  $services=$data['specialties']??null;$allowed=$db->query('SELECT name FROM lash_styles WHERE is_active=1')->fetchAll(PDO::FETCH_COLUMN);
  if(!is_array($services)||!array_is_list($services)||count($services)>count($allowed))respond(['error'=>'Select valid lash services.'],422);
  foreach($services as $s)if(!is_string($s)||!in_array($s,$allowed,true))respond(['error'=>'Select valid lash services.'],422);
  $capabilities=[];
  foreach(['colors','customizations','services'] as $key){$values=$data[$key]??[];if(!is_array($values)||!array_is_list($values)||count($values)>30)respond(['error'=>'Invalid capabilities.'],422);foreach($values as $v)if(!is_string($v)||mb_strlen($v)>80)respond(['error'=>'Invalid capability.'],422);$capabilities[$key]=array_values(array_unique($values));}
  $db->prepare('UPDATE studios SET specialties=?,capabilities=?,is_active=? WHERE id=?')->execute([json_encode(array_values(array_unique($services))),json_encode($capabilities),(int)$active,$id]);
 }else $db->prepare('UPDATE studios SET is_active=? WHERE id=?')->execute([(int)$active,$id]);
 respond(['success'=>true]);
}
if($action==='admin_password_save'){
 $old=$data['current_password']??'';$new=$data['password']??'';
 if(!is_string($old)||!is_string($new)||strlen($new)<8||strlen($new)>72)respond(['error'=>'Use a password of 8 to 72 bytes.'],422);
 $q=$db->prepare('SELECT password_hash FROM users WHERE id=?');$q->execute([$u['id']]);if(!password_verify($old,$q->fetchColumn()))respond(['error'=>'Current password is incorrect.'],422);
 $db->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash($new,PASSWORD_DEFAULT),$u['id']]);session_regenerate_id(true);respond(['success'=>true]);
}
