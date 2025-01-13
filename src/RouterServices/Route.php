<?php

namespace App\RouterServices;

class Route
{
    public $endpoint;
    public $controller;
    public $method;
    public $auth;
    public $role;

    /**
     * @param $endpoint
     * @param $controller
     * @param $method
     * @param $auth
     * @param $role
     */
    public function __construct($endpoint, $controller, $method, $auth=null, $role=null)
    {
        $this->endpoint = $endpoint;
        $this->controller = $controller;
        $this->method = $method;
        $this->auth = $auth;
        $this->role = $role;
    }

    /**
     * @return mixed
     */
    public function getEndpoint()
    {
        return $this->endpoint;
    }

    /**
     * @param mixed $endpoint
     */
    public function setEndpoint($endpoint)
    {
        $this->endpoint = $endpoint;
    }

    /**
     * @return mixed
     */
    public function getController()
    {
        return $this->controller;
    }

    /**
     * @param mixed $controller
     */
    public function setController($controller)
    {
        $this->controller = $controller;
    }

    /**
     * @return mixed
     */
    public function getMethod()
    {
        return $this->method;
    }

    /**
     * @param mixed $method
     */
    public function setMethod($method)
    {
        $this->method = $method;
    }

    /**
     * @return mixed
     */
    public function getAuth()
    {
        return $this->auth;
    }

    /**
     * @param mixed $auth
     */
    public function setAuth($auth)
    {
        $this->auth = $auth;
    }

    /**
     * @return mixed
     */
    public function getRole()
    {
        return $this->role;
    }

    /**
     * @param mixed $role
     */
    public function setRole($role)
    {
        $this->role = $role;
    }


}