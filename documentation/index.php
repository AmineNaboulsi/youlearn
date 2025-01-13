<?php
require($_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php");

$openapi = \OpenApi\Generator::scan([$_SERVER['DOCUMENT_ROOT'].'/src/Controller' , $_SERVER['DOCUMENT_ROOT'].'/documentation/ApiDocs.php']);

header('Content-Type: application/json');
echo $openapi->toJson();