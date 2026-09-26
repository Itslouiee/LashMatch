<?php
declare(strict_types=1);
// Service area: https://cavite.gov.ph/directory/
function caviteCities(): array {
 return ['Alfonso','Amadeo','Bacoor','Carmona','Cavite City','Dasmariñas','General Emilio Aguinaldo','General Mariano Alvarez','General Trias','Imus','Indang','Kawit','Magallanes','Maragondon','Mendez','Naic','Noveleta','Rosario','Silang','Tagaytay','Tanza','Ternate','Trece Martires'];
}
function caviteCity(string $city): ?string {
 $key=mb_strtolower(trim($city));
 $key=preg_replace('/,\s*cavite$/u','',$key);
 $key=preg_replace('/^city of\s+|\s+city$/u','',$key);
 $key=str_replace(['ñ','gen.'],['n','general'],$key);
 if($key==='mendez-nunez')$key='mendez';
 foreach(caviteCities() as $name) {
  $candidate=str_replace('ñ','n',mb_strtolower($name));
  $candidate=preg_replace('/\s+city$/u','',$candidate);
  if($key===$candidate)return $name;
 }
 return null;
}
