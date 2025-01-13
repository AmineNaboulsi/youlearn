<?php

namespace App\RouterServices;

use App\RouterServices\Route;
use App\MiddleWare\Auth;

class RouterServiceProvider
{
    private $endpoint;
    private $method;
    private $routes;
    public function __construct($method , $route){
        $this->method = $method;
        $this->endpoint = $route;
        $this->routes = [
            'GET' => [] ,
            'POST' => [] ,
            'PUT' => [] ,
            'DELETE' => [] ,
            'PATCH' => [] ,
        ];
    }
    public function get($endpoint , $controller , $action ,$auth=null , $role=null){
         $this->routes['GET'][] = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function post($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['POST'][]  = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function put($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['PUT'][]  = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function delete($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['DELETE'][]  = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function patch($endpoint , $controller , $action ,$auth=null , $role=null){
        $this->routes['PATCH'][]  = new Route($endpoint ,$controller, $action,$auth ,$role);
    }
    public function Dispatch(){
        $route = strtok($this->endpoint , '?');
        header('Content-Type: application/json');
        foreach($this->routes[$this->method] as $methodHTTP => $routeAction){
            if($routeAction->getEndpoint() == $route){
                $controller = $routeAction->getController();
                $action = $routeAction->getMethod();
                $authClass = $routeAction->getAuth();
                $role = $routeAction->getRole();
                // if($authClass != null){
                //     $auth = new $authClass($role);
                //     $auth->check($role);
                // }
                $controller = new $controller();
                echo json_encode($controller->$action());
                return ;
            }
        }

        echo json_encode([
            "status" => false ,
            "message" => 'Invalide Route'
        ]);
    }
}