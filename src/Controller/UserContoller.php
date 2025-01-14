<?php

namespace App\Controller;
use App\Models\User;
use App\RouterServices\Request;
use App\Repository\UserRepository;

/**
 * @OA\Info(title="You learn", version="0.1")
 */

class UserContoller
{

     /**
     * @OA\POST(
     *     path="/signin",
     *     summary="Sign in a user",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Login Success"),
     *     @OA\Response(response="404", description="Account Not Found"),
     *     @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function SignIn(Request $request)
    {
        $formData = $request->bodyFormData();
        $email = $formData['email'] ?? null;
        $password = $formData['password'] ?? null;

        if ($email && $password) {
            $UserRepository = new UserRepository();
            return $UserRepository->SignIn(new User(email: $email, password: $password));
            echo 'done';
            
        } else{
            http_response_code(422);
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
    /**
     * @OA\POST(
     *     path="/signup",
     *     summary="Sign up a new user",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Account created successfully"),
     *     @OA\Response(response="404", description="Account Not Found"),
     *     @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function SignUp(Request $request)
    {
        $formData = $request->bodyFormData();
        
        $parametres = ["name" , "email" , "password", "role"];
        $missingparam = array_filter($parametres , function($parametre){
            if(!isset($_POST[$parametre])) {
                var_dump($parametre);
                return $parametre;
            }
        });
        if(!$missingparam){
            $name = $formData["name"];
            $email = $formData["email"];
            $password = $formData["password"];
            $role = $formData["role"];
            $User = new User(name: $name , email: $email , password: $password , role: $role);
          
            if (!$User->isEmailValidation()) {
                return [
                    "status" => false,
                    "message" => "Invalid email format : example@gmail.com"
                ];
            }
            $ClientRepository = new UserRepository();
            return $ClientRepository->Save($User);
        }
            return [
                "status" => false,
                "message" => "Missing parametres"
            ];
    }
    /**
     * @OA\PATCH(
     *     path="/active",
     *     summary="Banned Or UnBanned a user",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Account Not Found"),
     *     @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function BannedOrUnBanned()
    {
        return [
            "status" => true ,
            "message" => 'BannedOrUnBanned'
        ];
    }
}