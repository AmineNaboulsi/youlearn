<?php

namespace App\Repository;
use App\Models\Course;
use App\Config\Database;
use App\MiddleWare\AuthMiddleware;
use App\Repository\UserRepository;
use App\Interface\RepositoryInterface;
use PDO;

class CourseRespository implements RepositoryInterface
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
    public function findByIdProject(Course $Course) {
        $con = Database::getConnection();
        $sql = "UPDATE Cours SET isprojected = :etat 
        WHERE Cours.id = :id;";
        $sqlDatareader = $con->prepare($sql) ;
        if($sqlDatareader->execute(
            [
                ":id" => $Course->getId(),
                ":etat" => $Course->isProjected()
            ]
        )){
            return [
                "status" => true ,
                "message" => 'Course ' . ($Course->isProjected() ?'Projected' :'UnProjected' )
            ];
          
        }else{
            return [
                "status" => true ,
                "message" => 'Failed to  ' . ($Course->isProjected() ?'Projected' :'UnProjected' ) . 'Course'
            ];
        }
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
    public function SearchCount(string $name) {
        $con = Database::getConnection();
        $sql = "SELECT DISTINCT COUNT(*) as count FROM Cours c
        LEFT JOIN `CoursTags` ct  ON ct.cours_id = c.id
        LEFT JOIN `Tags` t on ct.tag_id = t.id
        WHERE c.title like :name or t.title like :name ";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":name" => '%'.$name.'%']);
        $result = $sqlDatareader->fetch(\PDO::FETCH_ASSOC);
        return $result['count'];
    }
    public function Search(string $name , $limit , $offset) {
        $con = Database::getConnection();
        $sql = "SELECT DISTINCT c.* FROM Cours c
        JOIN `CoursTags` ct ON ct.cours_id = c.id
        JOIN `Tags` t on ct.tag_id = t.id
        WHERE c.title like :name or t.title like :name LIMIT $limit OFFSET $offset";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":name" => '%'.$name.'%']);
        $result = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);

        $courses = [];
        foreach ($result as $cours) {
            if($result){
                $sql = "SELECT Tags.* FROM CoursTags 
                JOIN `Tags` ON `Tags`.id = CoursTags.tag_id
                WHERE CoursTags.cours_id = :cours_id";
                $sqlDatareader = $con->prepare($sql) ;
                $sqlDatareader->execute([":cours_id" => $cours['id']]);
                $tags = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
                $cours['tags'] = $tags;
                $courses[] = $cours;
            }
        }
        if($offset==0){
            return [
                "count" => $this->SearchCount($name),
                "courses" => $courses
            ];
        }else return $courses;
    }
    public function getStatistics($id){
        $UserRepository = new UserRepository();
        $role = $UserRepository->findRoleById($id);
        $con = Database::getConnection();
        $sql="";
        $bidinpara=[];
        if($role=="admin"){
            $sql = "SELECT COUNT(*) as total FROM Inscription i  
            JOIN (SELECT * FROM `Cours` cc ) c ON c.id = i.cour_id
            UNION 
            SELECT COUNT(*) as total FROM `Cours` c 
            ";
        }else{
            $bidinpara=[':id'=> $id];
            $sql = "SELECT COUNT(*) as total FROM Inscription i  
            JOIN (SELECT * FROM `Cours` cc WHERE cc.instructor = :id) c ON c.id = i.cour_id
            UNION 
            SELECT COUNT(*) as total FROM `Cours` c 
            WHERE c.instructor = :id;";
        }
            $sqlDatareader = $con->prepare($sql) ;
            $sqlDatareader->execute($bidinpara);
            $result = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
            $usersbyenrolls = [];
            $cours = [
                "name" => "",
                "users" => []
            ];
            foreach ($this->getAllEnrollByCourse($id) as $key) {
                $cours["name"] = $key['title'];
                $cours["users"] = $this->getAllUserEnrollsByCourse($key['id']);
                $usersbyenrolls[] = $cours; 
            }
            usort($usersbyenrolls, function ($a, $b) {
                return count($b['users']) <=> count($a['users']);
            });
            return [
                'totalenrolls' => isset($result[0]) ? $result[0]['total'] : 0 ,
                'totalcourses' => isset($result[1]) ? $result[1]['total'] : 0 ,
                'users' => $usersbyenrolls
            ] ;
    }
    public function getAllEnrollByCourse($id){
        $con = Database::getConnection();
        $sql ="SELECT DISTINCT c.id , c.title FROM Inscription i  
            JOIN (SELECT * FROM `Cours` cc WHERE cc.instructor = :id) c ON c.id = i.cour_id
            JOIN User u ON u.id=i.user_id ;";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":id"=>$id]);
        return $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
    }
    public function getAllUserEnrollsByCourse($cour_id){
        $con = Database::getConnection();
        $sql ="SELECT c.id , u.name , u.email, i.`date` FROM Inscription i  
            JOIN (SELECT * FROM `Cours` cc WHERE cc.instructor = 8) c ON c.id = i.cour_id
            JOIN User u ON  u.id=i.user_id WHERE i.cour_id=:cour_id";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([':cour_id' => $cour_id ]);
        return   $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
    }
    // Find Course INcript or not 
    public function isEnrollcourse($iduser , $idcourse) {
        $con = Database::getConnection();
        $sql = "SELECT * FROM Inscription  where user_id = :user_id and cour_id = :cour_id";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":user_id" => $iduser , ":cour_id" => $idcourse ]);
        $result = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
        $UserRepository = new UserRepository();
        $role = $UserRepository->findRoleById($iduser);
        if(count($result)>0) {
            return [
                "status" => true ,
                'role' => $role
            ];
        }else 
        {
            return [
                "status" => false ,
                'role' => $role
            ];
        }
    }
    // Find Course by Etudiant and enroll
    public function findByIdAndEnroll($iduser , $idcourse) {
        $con = Database::getConnection();
        $sql = "INSERT INTO Inscription (user_id, cour_id, date) VALUES (:user_id ,:cour_id,CURRENT_DATE)";
        $sqlDatareader = $con->prepare($sql) ;
        if($sqlDatareader->execute([":user_id" => $iduser , ":cour_id" => $idcourse ])){
            return [
                "status" => true ,
                "message" => 'Enroll succssefully'
            ];
        }else{
            return [
                "status" => false ,
                "message" => 'Failed to Enroll Course'
            ];
        }
    }
     // Find Course by Etudiant and enroll
     public function EnrollCourses($iduser) {
        $con = Database::getConnection();
        $sql = "SELECT c.* FROM Inscription i 
            JOIN `Cours` c ON c.id = i.cour_id
            WHERE i.user_id = :user_id";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute([":user_id" => $iduser]);
        $Resultat = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
        return $Resultat;
    }
    //Find Total Number
    public function FindTotal() {
        $con = Database::getConnection();
        $sql = "SELECT Count(*) as count FROM Cours c
                JOIN `Inscription` i on i.cour_id = c.id 
                JOIN `User` u ON u.id = i.user_id
                WHERE c.isprojected = 1 ";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute();
        $result = $sqlDatareader->fetch(\PDO::FETCH_ASSOC);
        return $result['count'];
    }
    //Find 
    public function Find(int $limit ,int $offset) {
        $con = Database::getConnection();
        $sql = "SELECT c.id , c.title ,c.subtitle , c.description , c.cat_id ,c.content , c.contenttype , c.img , c.price , c.isprojected 
                , u.name as instructor FROM Cours c
                LEFT JOIN `User` u ON u.id = c.instructor  
                 WHERE c.isprojected = 1 LIMIT $limit OFFSET $offset ";
        $sqlDatareader = $con->prepare($sql) ;
        $sqlDatareader->execute();
        $result = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);

        $courses = [];
        foreach ($result as $cours) {
            if($result){
                $sql = "SELECT Tags.* FROM CoursTags 
                JOIN `Tags` ON `Tags`.id = CoursTags.tag_id
                WHERE CoursTags.cours_id = :cours_id";
                $sqlDatareader = $con->prepare($sql) ;
                $sqlDatareader->execute([":cours_id" => $cours['id']]);
                $tags = $sqlDatareader->fetchAll(\PDO::FETCH_ASSOC);
                $cours['tags'] = $tags;
                $courses[] = $cours;
            }
        }
        if($offset==0){
            return [
                "count" => $this->FindTotal(),
                "courses" => $courses
            ];
        }else{
            return $courses;
        }
        return null;
    }
     //Find All
    public function FindAll() {
        $AuthMiddleware = new AuthMiddleware();
        $id = $AuthMiddleware->ValideAuth();
        $UserRepository = new UserRepository();
        if($id>0){
            $role = $UserRepository->findRoleById($id);
            $con = Database::getConnection();
            $sql="";
            $bindpara = [];
            if($role=="admin")
                $sql = "SELECT * FROM Cours";
            else {
                $sql = "SELECT * FROM Cours c
                where c.instructor = :id";
                $bindpara = [
                    ":id" => $id
                ];  
            }
            $sqlDatareader = $con->prepare($sql) ;
            $sqlDatareader->execute($bindpara);
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
    }
    // Save Course to database
    public function Save($Course) {
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
    public function findByIdAndUpdate($Course): array {
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
    public function findByIdAndDelete($Course): array {
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