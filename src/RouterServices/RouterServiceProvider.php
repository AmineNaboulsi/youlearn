<?php

namespace App\RouterServices;

use App\RouterServices\Route;

class RouterServiceProvider
{
    private $endpoint;
    private $method;
    private $routes;
    public function __construct($method , $route){
        $this->method = $method;
        $this->endpoint = $route;
    }
    public function get($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['GET'] = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function post($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['POST'] = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function put($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['PUT'] = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function delete($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['DELETE'] = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function patch($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['PATCH'] = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function Dispatch(){
        print_r($this->routes);
    }
}