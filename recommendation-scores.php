<?php
declare(strict_types=1);

function scoredQuizRules(PDO $db,array $rules): array {
    $saved=$db->query("SELECT value FROM app_settings WHERE setting_key='quiz_style_scores'")->fetchColumn();
    $saved=$saved?json_decode($saved,true,512,JSON_THROW_ON_ERROR):[];
    $styles=$db->query('SELECT id AS style_id,name,type,is_active,is_archived FROM lash_styles WHERE is_active=1 AND is_archived=0 ORDER BY id')->fetchAll();
    // Editable starting preferences, not a claim of clinical suitability.
    $defaults=[
        'experience:first-time'=>['Classic'=>10,'Light Wispy'=>8,'Kitten Lash'=>7,'Mascara Lash'=>6],
        'experience:occasionally'=>['Hybrid Lash'=>10,'Light Wispy'=>8,'Cat Eye'=>7,'Wispy Cat Eye'=>6],
        'experience:regularly'=>['Hybrid Volume'=>10,'Wispy Volume'=>8,'Cat Eye'=>7,'Russian Volume'=>6],
        'experience:very-often'=>['Russian Volume'=>10,'Wispy Volume'=>9,'DragLash (Mega Volume)'=>8,'Strip Lash'=>7],
        'occasion:everyday'=>['Classic'=>10,'Light Wispy'=>8,'Kitten Lash'=>7,'Mascara Lash'=>6],
        'occasion:event'=>['Wispy Volume'=>10,'Hybrid Volume'=>9,'Wispy Cat Eye'=>8,'Russian Volume'=>7,'Strip Lash'=>6],
        'occasion:travel'=>['Classic'=>10,'Kitten Lash'=>8,'Light Wispy'=>7,'Hybrid Lash'=>6],
        'occasion:night'=>['Cat Eye'=>10,'Fox Eye'=>9,'Russian Volume'=>8,'Wispy Cat Eye'=>7,'DragLash (Mega Volume)'=>6],
    ];
    foreach($rules as &$rule){
        $key=$rule['volume'];$scores=[];
        foreach($styles as $style){
            $id=(int)$style['style_id'];$rank=array_search($id,$rule['style_ids'],true);
            $matched=isset($saved[$key])?($saved[$key][$id]??0)>0:($rank!==false||isset($defaults[$key][$style['name']]));
            $scores[$id]=isset($saved[$key])?(int)($saved[$key][$id]??0):($matched?3:0);
        }
        $rule['scores']=$scores;
        $rule['styles']=array_values(array_filter($styles,fn($s)=>$scores[(int)$s['style_id']]>0));
        usort($rule['styles'],fn($a,$b)=>($scores[(int)$b['style_id']]<=>$scores[(int)$a['style_id']])?:((int)$a['style_id']<=>(int)$b['style_id']));
        $rule['style_ids']=array_map(fn($s)=>(int)$s['style_id'],$rule['styles']);
    }
    unset($rule);return $rules;
}

function saveQuizScores(PDO $db,string $key,array $scores): void {
    $keys=['light','medium','full','mega'];
    foreach(quizContextChoices() as $kind=>$choices)foreach($choices as $value=>$label)$keys[]=$kind.':'.$value;
    if(!in_array($key,$keys,true))throw new InvalidArgumentException('Choose a valid quiz answer.');
    $db->beginTransaction();
    try{
        $allowed=$db->query('SELECT id FROM lash_styles WHERE is_active=1 AND is_archived=0 FOR UPDATE')->fetchAll(PDO::FETCH_COLUMN);
        $clean=[];
        foreach($scores as $id=>$points){
            if(!ctype_digit((string)$id)||!in_array((int)$id,array_map('intval',$allowed),true)||!is_int($points)||$points<0||$points>3)throw new InvalidArgumentException('Use active lash styles and whole-number points from 0 to 3.');
            $clean[(int)$id]=$points;
        }
        if(!array_filter($clean))throw new InvalidArgumentException('Give at least one lash style points.');
        $db->exec("INSERT IGNORE INTO app_settings(setting_key,value) VALUES('quiz_style_scores','{}')");
        $raw=$db->query("SELECT value FROM app_settings WHERE setting_key='quiz_style_scores' FOR UPDATE")->fetchColumn();
        $saved=json_decode($raw,true,512,JSON_THROW_ON_ERROR);$saved[$key]=$clean;
        $db->prepare("UPDATE app_settings SET value=? WHERE setting_key='quiz_style_scores'")->execute([json_encode($saved,JSON_THROW_ON_ERROR)]);
        $db->commit();
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}

function resolveScoredQuiz(PDO $db,string $volume,string $experience,string $occasion): array {
    foreach(quizContextChoices() as $kind=>$choices)if(!isset($choices[$kind==='experience'?$experience:$occasion]))throw new InvalidArgumentException('Please select valid quiz answers.');
    $rules=array_column(recommendationRules($db),null,'volume');
    $selected=[$volume,'experience:'.$experience,'occasion:'.$occasion];$candidates=[];
    foreach($selected as $key)foreach($rules[$key]['styles'] as $style){
        $id=(int)$style['style_id'];$candidates[$id]=$style;
        $candidates[$id]['score']=array_sum(array_map(fn($k)=>$rules[$k]['scores'][$id]??0,$selected));
        $candidates[$id]['volume_score']=$rules[$volume]['scores'][$id]??0;
    }
    $rows=array_values($candidates);
    usort($rows,fn($a,$b)=>($b['score']<=>$a['score'])?:($b['volume_score']<=>$a['volume_score'])?:((int)$a['style_id']<=>(int)$b['style_id']));
    if(!$rows)throw new InvalidArgumentException('The admin must configure points for active lash styles.');
    $rows=array_slice($rows,0,4);$best=$rows[0];
    return ['id'=>(int)$best['style_id'],'style'=>$best['name'],'finish'=>['Classic'=>'natural','Hybrid'=>'balanced','Wispy'=>'textured','Volume'=>'dramatic'][$best['type']]??'natural','recommended_styles'=>array_column($rows,'name'),'style_scores'=>array_column($rows,'score','name')];
}
