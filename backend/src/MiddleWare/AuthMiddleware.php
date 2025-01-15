<?php

namespace App\MiddleWare;
use App\Config\JwtUtil;
use App\RouterServices\Request;
use App\Repository\UserRepository;

class AuthMiddleware
{

    private string | array $role;
    public function __construct(string| array $newrole)
    {
        $this->role= $newrole;
    }
    public function ValideAuth()
    {
        if(isset($_SERVER["HTTP_AUTHORIZATION"])){
           [$type , $token] = explode(" ", $_SERVER["HTTP_AUTHORIZATION"]);
           if(strcmp($type  ,'Bearer')==0){
                return JwtUtil::ValidToken($token);
           }
        }
        return -1 ;
    }
    public function check(callable $nextAction){
        $UserRepository = new UserRepository();
        $id =$this->ValideAuth();
        if ($this->ValideAuth()==-1) {
            http_response_code(401);
            return [
                "status" => false,
                "message" => "Unauthorized access. Please log in."
            ];
        }else if ($this->ValideAuth()==-2) {
            http_response_code(401);
            return [
                "status" => false,
                "message" => "Token Expired. Please log in."
            ];
        }else if ($this->ValideAuth()==-3) {
            http_response_code(401);
            return [
                "status" => false,
                "message" => "Unauthorization failed. Please log in."
            ];
        }
        $Userole = $UserRepository->findRoleById($id);
        if($this->CheckRolePermission($Userole)){
            return $nextAction();
        }else{
            return [
                "status" => false,
                "message" => "No Permission to make this operation."
            ];
        }
    }
    public function CheckRolePermission($userRole){
        if(is_array($this->role)){
            $isPerm = false;
            foreach ($this->role as $rl) {
                if(strcmp($rl , $userRole)==0){
                    $isPerm = true;
                }
            }
            return $isPerm;
        }else{
            return strcmp($this->role , $userRole)==0;
        }
    }
}