<?php

namespace App\Repository;
use App\Models\User;
use App\Config\Database;
use App\Config\JwtUtil;
class UserRepository
{
    //Find All
    public function Find() {
        $con = Database::getConnection();
        $sqldataReader = $con->prepare("
            SELECT u.id , u.name , u.email , u.isActive , ur.name as role  FROM User u
            JOIN  Roles ur ON ur.id = u.role_id
        ");
        $sqldataReader->execute();
        return $sqldataReader->fetchAll(\PDO::FETCH_ASSOC);
    }
    // Find User by ID
    public function findById($id) {
        $con = Database::getConnection();
        $sqldataReader = $con->prepare("
            SELECT u.id , u.name , u.email , u.isActive , ur.name as role  FROM User u
            JOIN  Roles ur ON ur.id = u.role_id
            WHERE u.id =:id ");
        $sqldataReader->execute([
            ":id" => $id
        ]);
        // $User = $sqldataReader->fetchObject(User::class);
        // return $User;
        $User = $sqldataReader->fetch(\PDO::FETCH_ASSOC);
        return $User;
    }
    // Find role by ID
    public function findRoleById($id) {
        $con = Database::getConnection();
        $sqldataReader = $con->prepare("
            SELECT u.id , u.name , u.email , u.isActive , ur.name as role  FROM User u
            JOIN  Roles ur ON ur.id = u.role_id
            WHERE u.id =:id ");
        $sqldataReader->execute([
            ":id" => $id
        ]);
        $sqldataReader = $sqldataReader->fetch();
        return $sqldataReader['role'];
    }
    public function SignIn(User $user)
    {
        $con = Database::getConnection();
    
        // Use constants for reusable messages
        $INVALID_CREDENTIALS = "Invalid email or password.";
        $ACCOUNT_INACTIVE = "Your account is closed at the moment. Please contact support.";
        $LOGIN_SUCCESS = "Login successfully.";
    
        // Prepare the query
        $query = $con->prepare("SELECT id , password, isActive FROM User WHERE email = :email");
        $query->execute([":email" => $user->email]);
        $userData = $query->fetch();
    
        // Check if the user exists
        if (!$userData) {
            return $this->generateResponse(false, $INVALID_CREDENTIALS);
        }
    
        // Verify the password
        if (!password_verify($user->getPassword(), $userData['password'])) {
            return $this->generateResponse(false, $INVALID_CREDENTIALS);
        }
    
        // Check if the account is active
        if ($userData['isActive'] == 0) {
            return $this->generateResponse(false, $ACCOUNT_INACTIVE);
        }
    
        // Generate user object and token
        $user = new User('', $user->email, '');
        $user->id = $userData['id'];
        $token = JwtUtil::generateToken($user);
    
        return $this->generateResponse(true, $LOGIN_SUCCESS, $token);
    }

    private function generateResponse(bool $status, string $message, string $token = null): array
    {
        $response = [
            "status" => $status,
            "message" => $message
        ];
    
        if ($token) {
            $response["token"] = $token;
        }
    
        return $response;
    }
    // create new account    
    public function save(User $user): array
    {
        $con = Database::getConnection();
        try {
            $checkQuery = $con->prepare("SELECT email FROM User WHERE email = :email");
            $checkQuery->execute([":email" => $user->email]);

            if ($checkQuery->rowCount() > 0) {
                return [
                    "status" => false,
                    "message" => "Email already taken."
                ];
            }
            if (strcmp($user->getRole() , 'admin')==0 || $this->getRoleId($user->getRole()) == 0) {
                return [
                    "status" => false,
                    "message" => "No role with this specific information."
                ];
            }
            $idRole = $user->getRole()=='enseignant' ? 0 : 1 ;
            $userQuery = $con->prepare("
            INSERT INTO User (name, email, password, isActive,role_id) 
            VALUES (:name, :email, :password, :active, :role_id)");
            $userInserted = $userQuery->execute([
                ":name" => $user->name,
                ":email" => $user->email,
                ":password" => $user->HashedPassword() ,
                ":active" => $idRole,
                ":role_id" => $this->getRoleId($user->getRole())
            ]);

            if (!$userInserted) {
                return [
                    "status" => false,
                    "message" => "Failed to sign up. Please try again later."
                ];
            }

            return [
                "status" => true,
                "message" => "Account created successfully."
            ];
        } catch (\Exception $e) {
            return [
                "status" => false,
                "message" => "An error occurred: Failed to create account " 
            ];
        }
    }

    private function getRoleId(string $roleName): int
    {
        $con = Database::getConnection();
        $roleQuery = $con->prepare("SELECT id FROM Roles WHERE name = :role");
        $roleQuery->execute([":role" => $roleName]);

        $role = $roleQuery->fetch(\PDO::FETCH_ASSOC);
        return $role ? $role['id'] : 0;
    }

    public function BannedOrUnBanned(User $user) {
        $con = Database::getConnection();
        $sqldataReader = $con->prepare("UPDATE User SET isActive=:etat WHERE id=:id");
        if(
            $sqldataReader->execute([
                ":etat" => $user->isActive?1:0 ,
                ":id" => $user->id
            ])){
            return [
                "status" => true,
                "message" => "Account ".($user->isActive ? 'UnBanned' : 'Banned')." Successfuly"
            ];
        }else{
            return [
                "status" => false,
                "message" => "Failed to ".($user->isActive ? 'UnBanned' : 'Banned')." Client , Please try again later."
            ];
        }
    }

}