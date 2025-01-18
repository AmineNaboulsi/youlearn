<?php

namespace App\Repository;
use App\Models\Course;
use App\Config\Database;
class CourseRespository
{
    // Find Course by ID
    public function findById(int $id) {
        $con = Database::getConnection();
        $sql = "SELECT Cours.*, Categories.name as Categorie FROM Cours 
        LEFT JOIN `Categories` on Cours.cat_id = Categories.id 
        WHERE Cours.id = :id;";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":id" => $id]);
        $result = $sqlDatareader->fetch(\PDO::FETCH_ASSOC);

        if($result){
            $sql = "SELECT Tags.* FROM CoursTags 
            JOIN `Tags` ON `Tags`.id = CoursTags.tag_id
            WHERE CoursTags.cours_id = :cours_id ; ";
            $sqlDatareader = $con->prepare($sql) ;
            $sqlDatareader->execute([":cours_id" => $id]);
            $tags = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
            $result['tags'] = $tags;
        }
        return $result;
    }
     // Find Course by ID
    public function findByName(string $name) {
        $con = Database::getConnection();
        $sql = "SELECT * FROM Cours WHERE title = :name";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":name" => $name]);
        $result = $sqlDatareader->fetch(\PDO::FETCH_ASSOC);
        return $result;
    }
    //Find 
    public function Find() {
        $con = Database::getConnection();
        $sql = "SELECT * FROM Cours WHERE isprojected = 1";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute();
        $result = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);

        $courses = [];
        foreach ($result as $cours) {
            if($result){
                $sql = "SELECT Tags.* FROM CoursTags 
                JOIN `Tags` ON `Tags`.id = CoursTags.tag_id
                WHERE CoursTags.cours_id = :cours_id ; ";
                $sqlDatareader = $con->prepare($sql) ;
                $sqlDatareader->execute([":cours_id" => $cours['id']]);
                $tags = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
                $cours['tags'] = $tags;
                $courses[] = $cours;
            }
        }
        return $courses;
    }
     //Find All
     public function FindAll() {
        $con = Database::getConnection();
        $sql = "SELECT * FROM Cours";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute();
        $result = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);

        $courses = [];
        foreach ($result as $cours) {
            if($result){
                $sql = "SELECT Tags.* FROM CoursTags 
                JOIN `Tags` ON `Tags`.id = CoursTags.tag_id
                WHERE CoursTags.cours_id = :cours_id ; ";
                $sqlDatareader = $con->prepare($sql) ;
                $sqlDatareader->execute([":cours_id" => $cours['id']]);
                $tags = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
                $cours['tags'] = $tags;
                $courses[] = $cours;
            }
        }
        return $courses;
    }
    // Save Course to database
    public function Save(Course $Course) {
            if($this->findByName($Course->getTitle())){
                return [
                    "status" => false ,
                    "message" => 'Course name already exist , please choose another name'
                ];
            }
            $con = Database::getConnection();

            $con->beginTransaction();

            $sql = "INSERT INTO Cours (title,subtitle,img,isprojected,price,contenttype, description, content, cat_id,instructor) VALUES
                (:title,:subtitle,:img,:isprojected,0,:contenttype,:description,:content,:cat_id,:instructor)";
            $sqlDatareader = $con->prepare($sql) ;
          
            if($sqlDatareader->execute(
            [
                ':title' => $Course->getTitle(),
                ':subtitle' => $Course->getSubTitle(),
                ':instructor' => $Course->getInstructor(),
                ':img' => $Course->getImg(),
                ':isprojected' => $Course->isProjected(),
                ':description' => $Course->getDescription(),
                ':contenttype' => $Course->getContentType(),
                ':content' => $Course->getContent(),
                ':cat_id' => $Course->getCategory(),
            ]
            ) && $sqlDatareader->rowCount() > 0)
            {
                $id = $con->lastInsertId();
                //Add All Tags
                foreach ($Course->getTags() as $tag) {
                    $sql = "INSERT INTO CoursTags (tag_id, cours_id) VALUES (:tagid, :courid)";
                    $sqlData = $con->prepare($sql) ; 
                    if(!$sqlData->execute(
                        [
                            ':tagid' => $tag->id,
                            ':courid' => $id
                        ]) && $sqlData->rowCount() > 0)
                    {
                        $con->rollBack();
                        http_response_code(409);
                        return [
                            "status" => false ,
                            "message" => 'Failed to add Course for unknown reason, please try later'
                        ];
                    }
                }
                $con->commit();
                //End 
                return [
                    "status" => true ,
                    "message" => 'Course Added'
                ];
            }
            else 
            http_response_code(409);
            return [
                "status" => false ,
                "message" => 'Failed to add Course for unknown reason, please try later'
            ];
    }
    // Update Course from database
    public function findByIdAndUpdate(Course $Course): array {
        $con = Database::getConnection();
        $sql = "UPDATE Cours SET title=:title , subtitle=:subtitle , description = :description , content = :content , cat_id = :cat_id    
         WHERE id = :id";
        $sqlDatareader = $con->prepare($sql) ;
        
        if($sqlDatareader->execute(
            [
                ':title' => $Course->getTitle(),
                ':subtitle' => $Course->getSubTitle(),
                ':description' => $Course->getDescription(),
                ':content' => $Course->getContent(),
                ':cat_id' => $Course->getCategory(),
                ':id' => $Course->getId()
            ]) )
            return [
                "status" => true ,
                "message" => 'Course Updated'
            ];
        else 
            http_response_code(409);
            return [
                "status" => false ,
                "message" => 'Failed to Update Course for unknown reason, please try later'
            ];
    }
    // Delete Course from database
    public function findByIdAndDelete(Course $Course): array {
        $con = Database::getConnection();
        $sql = "DELETE FROM Cours WHERE id = :id";
        $sqlDatareader = $con->prepare($sql) ;
        if($sqlDatareader->execute(
            [
                ':id' => $Course->getId()
            ]) && $sqlDatareader->rowCount() > 0 )
            return [
                "status" => true ,
                "message" => 'Course Delete'
            ];
        else 
            return [
                "status" => false ,
                "message" => 'Failed to Delete Course for unknown reason, please try later'
            ];
    }
    public function findByIdAndReplaceAllTags(Course $Course) {
        $con = Database::getConnection();
        $con->beginTransaction();
        $sql = "DELETE FROM CoursTags WHERE cours_id =:courid";
        $sqlData = $con->prepare($sql) ; 
        if(!$sqlData->execute(
            [
                ':courid' => $Course->getId()
            ])){
                $con->rollBack();
                return [
                    "status" => false ,
                    "message" => 'Operation failed'
                ];
            }else{
                foreach ($Course->getTags() as $tag) {
                    $sql = "INSERT INTO CoursTags (tag_id, cours_id) VALUES (:tagid, :courid) ";
                    $sqlData = $con->prepare($sql) ; 
                    if(!$sqlData->execute(
                        [
                            ':tagid' => $tag->id,
                            ':courid' => $Course->getId()
                        ]) && $sqlData->rowCount() > 0)
                    {
                        $con->rollBack();
                        http_response_code(409);
                        return [
                            "status" => false ,
                            "message" => 'Failed to make operation'
                        ];
                    }
                }
                $con->commit();
                return [
                    "status" => true ,
                    "message" => 'Tags Replaced successfly'
                ];  
            }
    }
    public function findByIdAndAddTag(Course $Course , int $tag) {
        $con = Database::getConnection();

        $sql = "SELECT * FROM CoursTags  WHERE tag_id = :tagid and cours_id =:courid";
        $sqlData = $con->prepare($sql) ; 
        if($sqlData->execute(
            [
                ':tagid' => $tag,
                ':courid' => $Course->getId()
            ]) && $sqlData->rowCount() > 0){
                return [
                    "status" => false ,
                    "message" => 'Tag already exist'
                ];
            }else{
                $sql = "INSERT INTO CoursTags (tag_id, cours_id) VALUES (:tagid, :courid) ";
                $sqlData = $con->prepare($sql) ; 
                if(!$sqlData->execute(
                    [
                        ':tagid' => $tag,
                        ':courid' => $Course->getId()
                    ]) && $sqlData->rowCount() > 0)
                {
                    $con->rollBack();
                    http_response_code(409);
                    return [
                        "status" => false ,
                        "message" => 'Failed to add Course for unknown reason, please try later'
                    ];
                }else{
                    return [
                        "status" => true ,
                        "message" => 'Tag added '
                    ];  
                }
            }
        
    }
    public function findByIdAndDeleteTag(Course $Course , int $tag) {
        $con = Database::getConnection();
        $sql = "DELETE FROM CoursTags WHERE tag_id=:tagid and cours_id=:courid";
        $sqlData = $con->prepare($sql) ; 
        if($sqlData->execute(
            [
                ':tagid' => $tag,
                ':courid' => $Course->getId()
            ]) && $sqlData->rowCount() > 0)
        {
            return [
                "status" => true ,
                "message" => 'Tag Deleted'
            ];
        }else{
            http_response_code(409);
            return [
                "status" => false ,
                "message" => 'Failed to add Course for unknown reason, please try later'
            ];
        }
        
    }

}