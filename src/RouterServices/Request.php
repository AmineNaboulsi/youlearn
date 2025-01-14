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
    public function query() {
        return $this->queryParams;
    }
    public function bodyRaw() {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        return $data;
    }
    public function bodyFormData() {
        $data = [];
        foreach ($this->postData as $key => $value) {
            $data[$key] = $value;
        }
        return $data;
    }
}