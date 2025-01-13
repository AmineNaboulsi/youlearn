<?php

namespace App\MiddleWare;

class Auth
{
    private string $role;

    public function __construct($role)
    {
        $this->role = $role;
    }
    public function ValideAuth()
    {
        //depend on the role we can do some logic here
    }
}