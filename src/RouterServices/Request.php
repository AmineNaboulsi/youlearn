<?php

namespace App\RouterServices;

class Request {

    private $queryParams;
    private $postData;
    private $serverData;

    public function __construct()
    {
        $this->queryParams = $_GET;
        $this->postData = $_POST;
        $this->serverData = $_SERVER;
    }
    public function getMethod() {
        return $this->serverData['REQUEST_METHOD'];
    }

    public function getUri() {
        return $this->serverData['REQUEST_URI'];
    }
    public function getQueryParams() {
        return $this->queryParams;
    }
}