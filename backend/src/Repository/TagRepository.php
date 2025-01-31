<?php

namespace App\Repository;
use App\Models\Tag;
use App\Config\Database;
use App\Interface\RepositoryInterface;
use PDO;

class TagRepository implements RepositoryInterface
{
        // Find Tag by ID
        public function findById(int $id) {
            $con = Database::getConnection();
            $sql = "SELECT * FROM Tags WHERE id = :id";
            $sqlDatareader = $con->prepare($sql) ;
            $sqlDatareader->execute([ ":id" => $id]);
            // $result = $sqlDatareader->fetch(\PDO::FETCH_CLASS,Tag::class);
            $result = $sqlDatareader->fetch(\PDO::FETCH_ASSOC);
            return $result;
        }
        public function FindByName($name) {
            $con = Database::getConnection();
            $sql = "SELECT * FROM Tags WHERE title=:title";
            $sqlDatareader = $con->prepare($sql) ;
            $sqlDatareader->execute([':title'=>$name]);
            $result = $sqlDatareader->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        }
        public function Find() {
            $con = Database::getConnection();
            $sql = "SELECT * FROM Tags";
            $sqlDatareader = $con->prepare($sql) ;
            $sqlDatareader->execute();
            $result = $sqlDatareader->fetchAll(PDO::FETCH_ASSOC);
            return $result;
        }
        // Save Tag to database
        public function Save($Tag) {
            $con = Database::getConnection();
            if(!$this->FindByName($Tag->getName())){
                $sql = "INSERT INTO Tags (title) VALUES (:title)";
                $sqlDatareader = $con->prepare($sql) ;
                if($sqlDatareader->execute([':title' => $Tag->getName()]) && $sqlDatareader->rowCount() > 0)
                    return [
                        "status" => true ,
                        "message" => 'Tag Added'
                    ];
                else 
                    http_response_code(409);
                    return [
                        "status" => false ,
                        "message" => 'Failed to add Tag for unknown reason, please try later'
                    ];
            }else{
                return [
                    "status" => false ,
                    "message" => 'Tag all ready used'
                ];
            }
          
        }
        // Update Tag from database
        public function findByIdAndUpdate($Tag): array {
            $con = Database::getConnection();
            $sql = "UPDATE Tags SET title=:title WHERE id = :id";
            $sqlDatareader = $con->prepare($sql) ;
            if($sqlDatareader->execute(
                [   ':title' => $Tag->getName(),
                    ':id' => $Tag->getId()
                ]) && $sqlDatareader->rowCount() > 0)
                return [
                    "status" => true ,
                    "message" => 'Tag Updated'
                ];
            else 
                http_response_code(409);
                return [
                    "status" => false ,
                    "message" => 'Failed to Update Tag for unknown reason, please try later'
                ];
        }
        // Delete Tag from database
        public function findByIdAndDelete($Tag): array {
            $con = Database::getConnection();
            $sql = "DELETE FROM Tags WHERE id = :id";
            $sqlDatareader = $con->prepare($sql) ;
            if($sqlDatareader->execute(
                [
                    ':id' => $Tag->getId()
                ]) && $sqlDatareader->rowCount() > 0 )
                return [
                    "status" => true ,
                    "message" => 'Tag Delete'
                ];
            else 
                return [
                    "status" => false ,
                    "message" => 'Failed to Delete Tag for unknown reason, please try later'
                ];
        }

}