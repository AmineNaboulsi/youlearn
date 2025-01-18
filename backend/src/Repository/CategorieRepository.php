<?php

namespace App\Repository;

use App\Models\Categorie;
use App\Config\Database;

class CategorieRepository
{
    // Find Categorie by ID
    public function findById(int $id) {
        $con = Database::getConnection();
        $sql = "SELECT * FROM Categories WHERE id = :id";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([ ":id" => $id]);
        $Categorie = $sqlDatareader->fetchObject(Categorie::class);
        //$Categorie = $sqlDatareader->fetch(\PDO::FETCH_ASSOC);
        return $Categorie;
    }
    public function Find() {
        $con = Database::getConnection();
        $sql = "SELECT * FROM Categories";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute();
        $result = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
        return $result;
    }
    public function FindByName($name) {
        $con = Database::getConnection();
        $sql = "SELECT * FROM Categories WHERE name = :name";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":name" => $name]);
        $result = $sqlDatareader->fetch(\PDO::FETCH_ASSOC);
        return $result;
    }
    // Save Tag to database
    public function Save(Categorie $Categorie) {
        $con = Database::getConnection();
        if($this->FindByName($Categorie->getName())){
            return [
                "status" => false ,
                "message" => 'Categorie Name all ready used'
            ];
        }
        $sql = "INSERT INTO Categories (name) VALUES (:name)";
        $sqlDatareader = $con->prepare($sql) ;
        if($sqlDatareader->execute([':name' => $Categorie->getName()]) && $sqlDatareader->rowCount() > 0)
            
            return [
                "status" => true ,
                "message" => 'Categorie Added'
            ];
        else 
            http_response_code(409);
            return [
                "status" => false ,
                "message" => 'Failed to add Categorie for unknown reason, please try later'
            ];
    }

    // Update Categorie from database
    public function findByIdAndUpdate(Categorie $Categorie): array {
        $con = Database::getConnection();
        $sql = "UPDATE Categories SET name=:name WHERE id = :id";
        $sqlDatareader = $con->prepare($sql) ;
        if($sqlDatareader->execute(
            [   ':name' => $Categorie->getName(),
                ':id' => $Categorie->getId()
            ]) && $sqlDatareader->rowCount() > 0)
            return [
                "status" => true ,
                "message" => 'Categorie Updated'
            ];
        else 
            http_response_code(409);
            return [
                "status" => false ,
                "message" => 'Failed to Update Categorie for unknown reason, please try later'
            ];
    }

    // Delete Categorie from database
    public function findByIdAndDelete(Categorie $Categorie): array {
        $con = Database::getConnection();
        $sql = "DELETE FROM Categories WHERE id = :id";
        $sqlDatareader = $con->prepare($sql) ;
        if($sqlDatareader->execute(
            [
                ':id' => $Categorie->getId()
            ]) && $sqlDatareader->rowCount() > 0 )
            return [
                "status" => true ,
                "message" => 'Categorie Delete'
            ];
        else 
            return [
                "status" => false ,
                "message" => 'Failed to Delete Categorie for unknown reason, please try later'
            ];
    }
}