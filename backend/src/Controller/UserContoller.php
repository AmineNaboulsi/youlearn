<?php

namespace App\Controller;
use App\Models\User;
use App\RouterServices\Request;
use App\Repository\UserRepository;
use App\MiddleWare\AuthMiddleware;

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
            $User = new User(email: $email, password: $password);
            if (!$User->isEmailValidation()) {
                return [
                    "status" => false,
                    "message" => "Invalid email format : example@gmail.com"
                ];
            }
            return $UserRepository->SignIn($User);
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
    /**
     * @OA\GET(
     *     path="/validtk",
     *     summary="Banned Or UnBanned a user",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Account Not Found"),
     *     @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function Validtk()
    {
        $AuthMiddleware = new AuthMiddleware();
        if($AuthMiddleware->ValideAuth()>=0)
            return [
                "status" => true ,
                "code" => $AuthMiddleware->ValideAuth()
            ];
        else
            http_response_code(401);
            return [
                "status" => false ,
                "code" => $AuthMiddleware->ValideAuth()
            ];

    }
         /**
     * @OA\GET(
     *     path="/getuser",
     *     summary="Get User by id",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function getUser(){
        $UserRepository = new UserRepository();
        $AuthMiddleware = new AuthMiddleware();
        $id = $AuthMiddleware->ValideAuth();
        if($id<=0){
            http_response_code(404);
            return [
                "status" => false
            ];
        }
        return $UserRepository->findById($id);
    }
     /**
     * @OA\GET(
     *     path="/getusers",
     *     summary="Get Users",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function getUsers(){}
      /**
     * @OA\POST(
     *     path="/adduser",
     *     summary="Get Users",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function Save(){}
      /**
     * @OA\PUT(
     *     path="/edituser",
     *     summary="Get Users",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function EditUser(){}
      /**
     * @OA\DELETE(
     *     path="/deluser",
     *     summary="Get Users",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function DelUser(){}
}