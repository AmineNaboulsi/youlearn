<?php

namespace App\Controller;


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
    public function SignIn()
    {
        return [
            "status" => true ,
            "message" => 'SignIn'
        ];
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
    public function SignUp()
    {
        return [
            "status" => true ,
            "message" => 'SignUp'
        ];
    }
    /**
     * @OA\POST(
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