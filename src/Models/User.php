<?php

namespace App\Models;

class User
{
    public int $id ; 
    public string $name ; 
    public string $isActive ; 
    public string $email ; 
    private string $password ; 
    private string $role ;

    public function __construct($name="" , $email="" , $password="",$role="",$isActive="")
    {
        $this->name =  $name ;
        $this->email =  $email ;
        $this->password =  $password ;
        $this->role =  $role ;
        $this->isActive =  $isActive ;
    }
    public function isEmailValidation() : bool
    {
        return filter_var($this->email, FILTER_VALIDATE_EMAIL);
    }
    public function HashedPassword() {
        return password_hash($this->password , PASSWORD_BCRYPT);
    }
    public function getPassword() {
        return $this->password;
    }
    public function getRole() {
        return $this->role;
    }
}