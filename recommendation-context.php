<?php
declare(strict_types=1);

function quizContextChoices(): array {
    return [
        'experience'=>['first-time'=>'First Time','occasionally'=>'Occasionally','regularly'=>'Regularly','very-often'=>'Very Often'],
        'occasion'=>['everyday'=>'Everyday','event'=>'Special Events','travel'=>'Vacation / Travel','night'=>'Night Out'],
    ];
}

function contextRecommendationRules(PDO $db): array {
    $q=$db->query("SELECT value FROM app_settings WHERE setting_key='quiz_context_rules'");
    $saved=json_decode($q->fetchColumn()?:'{}',true,512,JSON_THROW_ON_ERROR);
    $styles=$db->query('SELECT id AS style_id,name,type,is_active,is_archived FROM lash_styles ORDER BY id')->fetchAll();
    $rules=[];
    foreach(quizContextChoices() as $kind=>$choices)foreach($choices as $value=>$label){
        $key=$kind.':'.$value;
        $ids=$saved[$key]??[];
        $linked=[];
        foreach($ids as $rank=>$id)foreach($styles as $style)if((int)$style['style_id']===$id){$style['sort_order']=$rank;$linked[]=$style;break;}
        $rules[]=['volume'=>$key,'label'=>$label,'category'=>$kind==='occasion'?'Lifestyle':'Preference','kind'=>$kind,'styles'=>$linked,'style_ids'=>$ids];
    }
    return $rules;
}

function rankQuizRecommendations(array $rows,array $rules,string $experience,string $occasion): array {
    foreach(quizContextChoices() as $kind=>$choices){
        $value=$kind==='experience'?$experience:$occasion;
        if(!isset($choices[$value]))throw new InvalidArgumentException('Please select valid quiz answers.');
    }
    // Volume determines eligible styles. Other answers adjust their order only.
    foreach($rows as &$row){
        $row['score']=4-(int)$row['sort_order'];
        foreach($rules as $rule){
            if(!in_array($rule['volume'],['experience:'.$experience,'occasion:'.$occasion],true))continue;
            $rank=array_search((int)$row['id'],$rule['style_ids'],true);
            if($rank!==false)$row['score']+=max(1,3-$rank);
        }
    }
    unset($row);
    usort($rows,fn($a,$b)=>($b['score']<=>$a['score'])?:((int)$a['sort_order']<=>(int)$b['sort_order']));
    return $rows;
}
