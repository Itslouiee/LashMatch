<?php
declare(strict_types=1);
require __DIR__.'/db.php';
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
ini_set('display_errors','0');
ini_set('session.use_strict_mode','1');
session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','samesite'=>'Strict','path'=>'/']);
session_start();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$error=''; $allowed=false;
try {
 $db=database();
 $token=$_POST['token'] ?? $_GET['token'] ?? '';
 $setting=$db->query("SELECT value FROM app_settings WHERE setting_key='admin_setup'")->fetchColumn();
 $setup=$setting?json_decode($setting,true):null;
 $allowed=in_array($_SERVER['REMOTE_ADDR'] ?? '',['127.0.0.1','::1'],true) && is_string($token) && $setup && ($setup['expires']??0)>time() && hash_equals($setup['hash'],hash('sha256',$token)) && !$db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
 if (!$allowed) { http_response_code(403); $error='This setup link is invalid, expired, or has already been used. Run prepare-admin.php locally to generate a new link if no administrator exists.'; }
 elseif ($_SERVER['REQUEST_METHOD']==='POST') {
  if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'],$_POST['csrf'])) throw new RuntimeException('Refresh the page and try again.');
  $name=trim((string)($_POST['name']??'')); $email=strtolower(trim((string)($_POST['email']??''))); $password=(string)($_POST['password']??'');
  if ($name==='' || mb_strlen($name)>100 || !filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>254 || strlen($password)<12 || strlen($password)>72) throw new RuntimeException('Enter a name, a valid email, and a password between 12 and 72 bytes.');
  $db->beginTransaction();
  $locked=$db->query("SELECT value FROM app_settings WHERE setting_key='admin_setup' FOR UPDATE")->fetchColumn();
  if (!$locked || $locked!==$setting || $db->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn()) throw new RuntimeException('Administrator setup is already complete.');
  $db->prepare("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'admin')")->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT)]);
  $id=(int)$db->lastInsertId();$db->exec("DELETE FROM app_settings WHERE setting_key='admin_setup'");$db->commit();
  session_regenerate_id(true);$_SESSION['user']=['id'=>$id,'name'=>$name,'email'=>$email,'role'=>'admin'];$_SESSION['csrf']=bin2hex(random_bytes(32));
  header('Location: admin/admin.html');exit;
 }
} catch(Throwable $e) { if(isset($db)&&$db->inTransaction())$db->rollBack(); $error=$e instanceof PDOException?'Could not create the administrator. Use an email that is not already registered.':$e->getMessage(); }
function esc(string $value): string {return htmlspecialchars($value,ENT_QUOTES,'UTF-8');}
?>
<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Create administrator | LashMatch</title>
<style>body{margin:0;background:#fff4f8;color:#352a35;font:16px/1.5 Arial,sans-serif}main{max-width:440px;margin:8vh auto;padding:32px;background:white;border:1px solid #edcfdb;border-radius:20px}h1{font-family:Georgia,serif}label{display:block;margin:18px 0}input{display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid #d9b5c5;border-radius:8px;margin-top:6px;font:inherit}button{padding:13px 20px;background:#b5577a;border:0;color:white;border-radius:8px;font:inherit;cursor:pointer}.error{color:#a62f50}a{color:#a3496b}</style>
<main><h1>Create your admin account</h1><p>Manage clients, quiz results, studios, and recommendations from one LashMatch account.</p>
<?php if($error): ?><p class="error" role="alert"><?=esc($error)?></p><?php endif; ?>
<?php if($allowed): ?><form method="post"><input type="hidden" name="token" value="<?=esc($token)?>"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><label>Name<input name="name" required maxlength="100" autocomplete="name"></label><label>Email<input type="email" name="email" required maxlength="254" autocomplete="email"></label><label>Password (at least 12 characters)<input type="password" name="password" required minlength="12" maxlength="72" autocomplete="new-password"></label><button>Create admin account</button></form><?php endif; ?>
<p><a href="login.html?role=admin">Back to sign in</a></p></main></html>
