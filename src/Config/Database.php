<?php

namespace App\Config;
require_once $_SERVER['DOCUMENT_ROOT'] . '/vendor/autoload.php';
use Dotenv\Dotenv;
class Database
{
    public static function getConnection(){
        $dotenv = Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
        $dotenv->load();
        $host = $_ENV['HOST'];
        $dbname = $_ENV['S3_BUCKET'];
        $user = $_ENV['S3_BUCKET'];
        $password = $_ENV['S3_BUCKET'];
        $port = $_ENV['S3_BUCKET'];
        $dsn = "mysql:host=$host;dbname=$dbname;port=$port";
        $pdo = new \PDO($dsn, $user, $password);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }
}