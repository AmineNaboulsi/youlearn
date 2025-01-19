<?php

namespace App\Controller;
use App\Models\User;
use App\RouterServices\Request;
use App\Repository\UserRepository;
use App\Repository\CourseRespository;
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
            if(!isset($_POST[$parametre]) || empty($_POST[$parametre])) {
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
    public function BannedOrUnBanned(Request $request)
    {
        $parametres = ["id" , "etat"];
        $missingparam = array_filter($parametres , function($parametre){
            if(!isset($_GET[$parametre])) return $parametre;
        });
        if(!$missingparam){

            $id = $_GET["id"];
            $etat = $_GET["etat"];
            $User = new User();
            $User->id = $id;
            $User->isActive = $etat;
            $ClientRepository = new UserRepository();
            return $ClientRepository->BannedOrUnBanned($User);
        }
        else
            return [
                "status" => false,
                "message" => "Missing parametres"
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
    public function Validtk(Request $request)
    {
        $AuthMiddleware = new AuthMiddleware();
        $id = $AuthMiddleware->ValideAuth() ;
        $UserRepository = new UserRepository();
        if($id>=0){
            $role = $UserRepository->findRoleById($id);
            return [
                "status" => true ,
                "role" => $role ,
                "code" => $AuthMiddleware->ValideAuth()
            ];
        }
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
    public function getUser(Request $request){
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
     *     path="/getstudents",
     *     summary="Get Users",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function getStudents(Request $request){
        $UserRepository = new UserRepository();
        return $UserRepository->FindBy('etudiant');
    }
    /**
     * @OA\GET(
     *     path="/getteachers",
     *     summary="Get Users",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function getTeachers(Request $request){
        $UserRepository = new UserRepository();
        return $UserRepository->FindBy('enseignant');
    }

      /**
     * @OA\DELETE(
     *     path="/deluser",
     *     summary="Get Users",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function DelUser(Request $request){
        if(isset($_GET["id"])){
            $UserRepository = new UserRepository();
            return $UserRepository->DelById($_GET["id"]);
        }else{
            return [
                "status" => false,
                "message" => "Missing parametres"
            ];
        }
    }
}