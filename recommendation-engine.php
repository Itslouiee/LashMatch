<?php
declare(strict_types=1);
require_once __DIR__.'/recommendation-context.php';
require_once __DIR__.'/recommendation-scores.php';
function recommendationRules(PDO $db): array {
 $rules=$db->query('SELECT volume,finish FROM recommendation_rules ORDER BY FIELD(volume,"light","medium","full","mega")')->fetchAll();
 $rows=$db->query('SELECT r.volume,r.style_id,r.sort_order,s.name,s.type,s.is_active,s.is_archived FROM recommendation_rule_styles r JOIN lash_styles s ON s.id=r.style_id ORDER BY r.sort_order')->fetchAll();
 foreach($rules as &$rule){$rule['label']=ucfirst($rule['volume']).' volume';$rule['category']='Preference';$rule['kind']='volume';$rule['styles']=array_values(array_filter($rows,fn($r)=>$r['volume']===$rule['volume']));$rule['style_ids']=array_map(fn($s)=>(int)$s['style_id'],$rule['styles']);}unset($rule);return scoredQuizRules($db,array_merge($rules,contextRecommendationRules($db)));
}
function resolveRecommendation(PDO $db,string $volume,string $experience='',string $occasion=''): array {
 if(!in_array($volume,['light','medium','full','mega'],true))throw new InvalidArgumentException('Select a valid volume preference.');
 if($experience!==''||$occasion!=='')return resolveScoredQuiz($db,$volume,$experience,$occasion);
 $q=$db->prepare('SELECT s.id,s.name,s.type,r.sort_order FROM recommendation_rule_styles r JOIN lash_styles s ON s.id=r.style_id WHERE r.volume=? AND s.is_active=1 AND s.is_archived=0 ORDER BY r.sort_order');$q->execute([$volume]);$rows=$q->fetchAll();
 if(!$rows||(int)$rows[0]['sort_order']!==0)throw new InvalidArgumentException('The admin must configure an active recommendation for this volume.');
 return ['id'=>(int)$rows[0]['id'],'style'=>$rows[0]['name'],'finish'=>['Classic'=>'natural','Hybrid'=>'balanced','Wispy'=>'textured','Volume'=>'dramatic'][$rows[0]['type']]??'natural','recommended_styles'=>array_column($rows,'name')];
}
function saveRecommendationRules(PDO $db,array $rules): void {
 $context=[];
 foreach(quizContextChoices() as $kind=>$choices)foreach($choices as $value=>$label){$key=$kind.':'.$value;if(array_key_exists($key,$rules)){$context[$key]=$rules[$key];unset($rules[$key]);}}
 if($context&&count($context)!==8)throw new InvalidArgumentException('Provide all experience and occasion rules.');
 if(count($rules)!==4||array_diff(['light','medium','full','mega'],array_keys($rules)))throw new InvalidArgumentException('Provide all four volume rules.');
 $db->beginTransaction();try{
 $allowed=$db->query('SELECT id,type FROM lash_styles WHERE is_active=1 AND is_archived=0 FOR UPDATE')->fetchAll(PDO::FETCH_KEY_PAIR);
 foreach($context as $ids){if(!is_array($ids)||!array_is_list($ids)||count($ids)>4||count(array_unique($ids))!==count($ids))throw new InvalidArgumentException('Choose up to four different styles per quiz answer.');foreach($ids as $id)if(!is_int($id)||!isset($allowed[$id]))throw new InvalidArgumentException('Choose active styles from the menu.');}
 if($context)$db->prepare("INSERT INTO app_settings(setting_key,value) VALUES('quiz_context_rules',?) ON DUPLICATE KEY UPDATE value=VALUES(value)")->execute([json_encode($context,JSON_THROW_ON_ERROR)]);
 foreach($rules as $volume=>$ids){if(!is_array($ids)||!array_is_list($ids)||count($ids)<1||count($ids)>4||count(array_unique($ids))!==count($ids))throw new InvalidArgumentException('Choose one main style and up to three different related styles.');foreach($ids as $id)if(!is_int($id)||!isset($allowed[$id]))throw new InvalidArgumentException('Choose active styles from the menu.');}
 $db->exec('DELETE FROM recommendation_rule_styles');$q=$db->prepare('INSERT INTO recommendation_rule_styles(volume,style_id,sort_order) VALUES(?,?,?)');$finish=$db->prepare('UPDATE recommendation_rules SET finish=? WHERE volume=?');
 foreach($rules as $volume=>$ids){foreach($ids as $rank=>$id)$q->execute([$volume,$id,$rank]);$finish->execute([['Classic'=>'natural','Hybrid'=>'balanced','Wispy'=>'textured','Volume'=>'dramatic'][$allowed[$ids[0]]],$volume]);}$db->commit();
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}
