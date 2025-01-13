<?php

namespace App\RouterServices;

use App\RouterServices\Route;
use App\RouterServices\Request;
use ReflectionMethod;

class RouterServiceProvider
{
    private $endpoint;
    private $method;
    private $routes;
    public function __construct(){
        $this->method = $_SERVER["REQUEST_METHOD"];
        $this->endpoint = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
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
    public function dispatch(){
        $route = parse_url($this->endpoint , PHP_URL_PATH);
        header('Content-Type: application/json');
        foreach($this->routes[$this->method] as $routeAction){
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
                echo json_encode($controller->$action(new Request()));
                return ;
            }
        }

        echo json_encode([
            "status" => false ,
            "message" => 'Invalide Route'
        ]);
    }

    private function resolveMethodParameters(ReflectionMethod $method, $params=null)
    {
        $arguments = [];
        foreach ($method->getParameters() as $param) {
            $name = $param->getName();
            $type = $param->getType();

            if (isset($params[$name])) {
                // If a type is hinted, try to resolve it as a model
                if ($type && !$type->isBuiltin()) {
                    $modelClass = $type->getName();
                    $arguments[] = $modelClass::find($params[$name]); // Example: Model::find(id)
                } else {
                    $arguments[] = $params[$name];
                }
            } elseif ($param->isDefaultValueAvailable()) {
                $arguments[] = $param->getDefaultValue();
            } else {
                throw new \Exception("Unable to resolve parameter '{$name}'");
            }
        }
        return $arguments;
    }

}