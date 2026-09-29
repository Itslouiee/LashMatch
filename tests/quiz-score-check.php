<?php
require dirname(__DIR__).'/db.php';require dirname(__DIR__).'/recommendation-engine.php';
$db=database();
$db->exec('CREATE TEMPORARY TABLE quiz_test_settings LIKE app_settings');
$db->exec('INSERT INTO quiz_test_settings SELECT * FROM app_settings');
$db->exec('CREATE TEMPORARY TABLE app_settings LIKE quiz_test_settings');
$db->exec('INSERT INTO app_settings SELECT * FROM quiz_test_settings');
$db->exec("DELETE FROM app_settings WHERE setting_key IN ('quiz_style_scores','quiz_context_rules')");
function scoreCheck(bool $ok,string $message):void {if(!$ok)throw new RuntimeException($message);echo "PASS: $message\n";}
$rules=array_column(recommendationRules($db),null,'volume');
$ids=$db->query('SELECT name,id FROM lash_styles WHERE is_active=1 AND is_archived=0')->fetchAll(PDO::FETCH_KEY_PAIR);
$classic=(int)$ids['Classic'];$fox=(int)$ids['Fox Eye'];
scoreCheck(count($rules)===12,'All 12 quiz choices have matching styles');
scoreCheck($rules['experience:first-time']['scores'][$classic]===3,'First Time gives Classic 3 points');
foreach($rules as $rule)scoreCheck(!array_diff(array_values($rule['scores']),[0,3]),$rule['label'].' uses only 0 or 3 points');
saveQuizScores($db,'experience:first-time',[$classic=>3,$fox=>3]);
saveQuizScores($db,'light',[$classic=>3,$fox=>3]);
saveQuizScores($db,'occasion:everyday',[$classic=>3]);
$match=resolveRecommendation($db,'light','first-time','everyday');
scoreCheck($match['style']==='Classic'&&$match['style_scores']['Classic']===9&&$match['style_scores']['Fox Eye']===6,'Three matches give 9 points; two give 6');
saveQuizScores($db,'occasion:night',[$fox=>3]);
$match=resolveRecommendation($db,'light','first-time','night');
scoreCheck($match['style']==='Fox Eye'&&$match['style_scores']['Fox Eye']===9,'Changing occasion changes the highest-scoring recommendation');
saveQuizScores($db,'experience:first-time',[$classic=>3]);
saveQuizScores($db,'occasion:travel',[$classic=>3]);
saveQuizScores($db,'light',[$fox=>3]);
$match=resolveRecommendation($db,'light','first-time','night');
scoreCheck($match['style_scores']['Classic']===3&&$match['style_scores']['Fox Eye']===6,'Unmatched answers award zero points');
foreach([[$classic=>-1],[$classic=>101],[$classic=>1.5],[$classic=>'5'],[$classic=>0],[999999=>3]] as $bad){
    try{saveQuizScores($db,'light',$bad);throw new RuntimeException('Invalid points accepted');}catch(InvalidArgumentException $expected){}
}
scoreCheck(resolveRecommendation($db,'light','first-time','night')['style']==='Fox Eye','Invalid saves leave matching styles unchanged');
foreach(['light','medium','full','mega'] as $volume)foreach(array_keys(quizContextChoices()['experience']) as $experience)foreach(array_keys(quizContextChoices()['occasion']) as $occasion){
    $match=resolveRecommendation($db,$volume,$experience,$occasion);
    if(count($match['recommended_styles'])<1||count($match['recommended_styles'])>4||array_diff(array_values($match['style_scores']),[3,6,9]))throw new RuntimeException('Invalid combined scores');
}
echo "PASS: all 64 answer combinations.\n";
saveQuizScores($db,'experience:first-time',[$classic=>2,$fox=>1]);
$rules=array_column(recommendationRules($db),null,'volume');
scoreCheck($rules['experience:first-time']['scores'][$classic]===2,'Custom points within 0 to 3 survive a reload');
foreach ([4,100,-1,1.5] as $invalid) {
    $rejected=false;
    try { saveQuizScores($db,'experience:first-time',[$classic=>$invalid]); }
    catch (InvalidArgumentException $e) { $rejected=true; }
    scoreCheck($rejected,'Invalid points rejected: '.$invalid);
}
$rules=array_column(recommendationRules($db),null,'volume');
scoreCheck($rules['experience:first-time']['scores'][$classic]===2,'Rejected saves preserve existing scores');
saveQuizScores($db,'experience:first-time',[$classic=>0,$fox=>3]);
$rules=array_column(recommendationRules($db),null,'volume');
scoreCheck($rules['experience:first-time']['scores'][$classic]===0&&$rules['experience:first-time']['scores'][$fox]===3,'Both boundary values 0 and 3 are accepted');
echo "Live settings unchanged.\n";
