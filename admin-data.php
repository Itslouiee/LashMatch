<?php
declare(strict_types=1);
if(!function_exists('requireUser')){http_response_code(404);exit;}
function adminSnapshot(array $user): array {
 $db=database();$users=$db->query('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY id DESC')->fetchAll();
 $matches=$db->query('SELECT m.id,m.user_id,u.name,u.email,s.name AS style,m.eye_shape,m.finish,m.occasion,m.volume,m.experience,m.created_at FROM lash_matches m JOIN users u ON u.id=m.user_id JOIN lash_styles s ON s.id=m.lash_style_id ORDER BY m.id DESC')->fetchAll();
 $studios=studioRows(true);$visible=array_values(array_filter($studios,fn($s)=>(bool)$s['is_active']&&$s['in_service_area']));$ids=array_column($visible,'id');
 $saved=$db->query('SELECT user_id,kind,item,created_at FROM saved_items ORDER BY created_at DESC')->fetchAll();
 $activeLooks=$db->query('SELECT name FROM lash_styles WHERE is_active=1')->fetchAll(PDO::FETCH_COLUMN);
 foreach($saved as &$s)$s['available']=$s['kind']==='looks'?in_array($s['item'],$activeLooks,true):in_array((int)$s['item'],$ids,true);unset($s);
 $tryons=$db->query('SELECT user_id,COUNT(*) AS total,MAX(created_at) AS last_completed FROM tryon_sessions GROUP BY user_id')->fetchAll();
 foreach($users as &$a){$a['id']=(int)$a['id'];$a['quiz_count']=count(array_filter($matches,fn($m)=>(int)$m['user_id']===$a['id']));$a['tryon_count']=0;$a['last_tryon']=null;foreach($tryons as $t)if((int)$t['user_id']===$a['id']){$a['tryon_count']=(int)$t['total'];$a['last_tryon']=$t['last_completed'];}}unset($a);
 $clients=array_values(array_filter($users,fn($a)=>$a['role']==='user'));$clientIds=array_column($clients,'id');
 $styles=$db->query('SELECT id,name,description,type,is_active,image_data FROM lash_styles WHERE is_archived=0 ORDER BY id')->fetchAll();
 $summary=['clients'=>count($clients),'lash_styles'=>count($styles),'active_studios'=>count($visible),'completed_quizzes'=>count(array_filter($matches,fn($m)=>in_array((int)$m['user_id'],$clientIds,true))),'completed_tryons'=>array_sum(array_column($clients,'tryon_count'))];
 return ['user'=>$user,'users'=>$users,'matches'=>$matches,'saved'=>$saved,'studios'=>$studios,'styles'=>$styles,'cavite_cities'=>caviteCities(),'rules'=>recommendationRules($db),'summary'=>$summary];
}
