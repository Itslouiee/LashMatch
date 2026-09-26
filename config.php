<?php
declare(strict_types=1);
return [
 'host'=>getenv('LASHMATCH_DB_HOST') ?: '127.0.0.1',
 'port'=>getenv('LASHMATCH_DB_PORT') ?: '3306',
 'database'=>getenv('LASHMATCH_DB_NAME') ?: 'lashmatch',
 'username'=>getenv('LASHMATCH_DB_USER') ?: 'root',
 'password'=>getenv('LASHMATCH_DB_PASSWORD') ?: '',
];
