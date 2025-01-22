<?php

namespace App\Controller;
use App\Models\Course;
use App\RouterServices\Request;
use App\Repository\CourseRespository;
use App\MiddleWare\AuthMiddleware;
use App\Repository\UserRepository;

class CourseController
{

      /**
     * @OA\GET(
     *      path="/getcourses",
     *      summary="Get all courses",
     *      tags={"courses"},
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=false,
     *          description="ID of the category",
     *          @OA\Schema(
     *              type="integer"
     *          )
     *      ),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public function getCourses(Request $request){
        $CourseRespository = new CourseRespository();
        if(isset($request->query()['id']))
        {
            if(is_numeric($request->query()['id']))
                return $CourseRespository->findById($request->query()['id']);
            else return [];
        }
        else if(isset($request->query()['limit']) && isset($request->query()['offset']) && is_numeric($request->query()['limit']) && is_numeric($request->query()['offset']))
            return $CourseRespository->Find(intval($request->query()['limit']),intval($request->query()['offset']));
        else return [];
    }
      /**
     * @OA\GET(
     *      path="/getstatistics",
     *      summary="Get all courses",
     *      tags={"courses"},
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=false,
     *          description="ID of the category",
     *          @OA\Schema(
     *              type="integer"
     *          )
     *      ),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public function Statistics(Request $request){
        $AuthMiddleware = new AuthMiddleware();
        $id = $AuthMiddleware->ValideAuth();
        if($id>0){
            $CourseRespository = new CourseRespository();
            return $CourseRespository->getStatistics($id);
        }else{
            return null;
        }
    }
    /**
     * @OA\GET(
     *      path="/getallcourses",
     *      summary="Get all courses",
     *      tags={"courses"},
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=false,
     *          description="ID of the category",
     *          @OA\Schema(
     *              type="integer"
     *          )
     *      ),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public function getAllCourses(Request $request){
        $CourseRespository = new CourseRespository();
        if(isset($request->query()['id']))
            if(is_numeric($request->query()['id']))
                return $CourseRespository->findById($request->query()['id']);
            else return false;
        else
            return $CourseRespository->FindAll();
    }
       /**
     * @OA\GET(
     *     path="/isenrollcourse",
     *     summary="Get enrolls courses",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function isEnrollcourse(Request $request){
        $AuthMiddleware = new AuthMiddleware();
        $id = $AuthMiddleware->ValideAuth();
        $query = $request->query();
        if($id && isset($query['id'])){
            $RepoCourses = new CourseRespository();
            return $RepoCourses->isEnrollcourse($id , $query['id']);
        }else{
            return null;
        }
    }
      /**
     * @OA\GET(
     *     path="/enrollcourse",
     *     summary="Get enrolls courses",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function EnrollCourse(Request $request){
        $AuthMiddleware = new AuthMiddleware();
        $id = $AuthMiddleware->ValideAuth();
        $FormData = $request->bodyFormData();
        if($id && isset($FormData['id'])){
            $RepoCourses = new CourseRespository();
            return $RepoCourses->findByIdAndEnroll($id ,$FormData['id']);
        }else{
            return null;
        }
    }
       /**
     * @OA\GET(
     *     path="/getenrollcourses",
     *     summary="Get enrolls courses",
     *     tags={"User"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function EnrollCourses(Request $request){
        $AuthMiddleware = new AuthMiddleware();
        $id = $AuthMiddleware->ValideAuth();
        if($id){
            $RepoCourses = new CourseRespository();
            return $RepoCourses->EnrollCourses($id);
        }else{
            return null;
        }
    }
    /**
     * @OA\GET(
     *     path="/search",
     *     summary="",
     *     tags={"Course"},
     *     @OA\Response(response="200", description="Success"),
     *     @OA\Response(response="404", description="Not Data Found"),
     * )
     */
    public function Search(Request $request){
        $param = ['course' , 'limit','offset'];
        if(isset($request->query()['course']) && isset($request->query()['limit'])
         && isset($request->query()['offset']) && is_numeric($request->query()['limit']) && is_numeric($request->query()['offset'])){
            $RepoCourses = new CourseRespository();
            return $RepoCourses->Search($request->query()['course'] , $request->query()['limit'] ,$request->query()['offset']);
        }else{
            return null;
        }
    }
     /**
     * @OA\POST(
     *      path="/addcourse",
     *      summary="Add course",
     *      tags={"courses"},
     *      @OA\Parameter(name="title",in="path",required=true,),
     *      @OA\Parameter(name="description",in="path",required=true),
     *      @OA\Parameter(name="content",in="path",required=true),
     *      @OA\Parameter(name="category",in="path",required=true),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */

    public function AddCourse(Request $request){
        $formData = $request->bodyRaw();
        $parametres = ['title' ,'subtitle','img','contenttype', 'description' ,'category','content','tags'];
        $missingparam = array_filter($parametres, function ($parametre) use ($formData) {
            return !isset($formData->$parametre); 
        });
      
        if(!$missingparam){
            if(count($formData->tags)<3){
                http_response_code(422);
                return [
                    "status" => false ,
                    "message" => 'Tags are requied ,minimum is 3'
                ];
            }
            $auth = new AuthMiddleware();
            $id = $auth->ValideAuth();
            $CourseRespository = new CourseRespository();
            $newCourse = new Course(
                title: $formData->title,
                instructor: $id ,
                subtitle: $formData->subtitle,
                img: $formData->img,
                description: $formData->description,
                category: $formData->category,
                contenttype: $formData->contenttype,
                content: $formData->content,
                tags: $formData->tags
            );
            return $CourseRespository->save(
                $newCourse 
            );
        }
        else{
            http_response_code(422);
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
      /**
     * @OA\POST(
     *      path="/addcoursetag",
     *      summary="Add tag to course",
     *      tags={"courses"},
     *      @OA\Parameter(name="id",in="path",required=true,),
     *      @OA\Parameter(name="tag",in="path",required=true),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public function AddCourseTag(Request $request){
        $CourseRespository = new CourseRespository();
        $formData = $request->bodyFormData();
        $formDataRaw = $request->bodyRaw();
        if(isset($formData['id']) && is_numeric($formData['id']) && !empty($formData['id']) && isset($formData['tag'])&& is_numeric($formData['tag'])  && !empty($formData['tag'])){
            return $CourseRespository->findByIdAndAddTag(new Course(id: $formData['id']), tag: $formData['tag']);
        }
        else if(isset($formDataRaw->id) && !empty($formDataRaw->id) && isset($formDataRaw->tags) && !empty($formDataRaw->tags) ){
            return $CourseRespository->findByIdAndReplaceAllTags(new Course(id: $formDataRaw->id ,tags: $formDataRaw->tags));
        }
        else{
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
       
    }
    /**
     * @OA\DELETE(
     *      path="/delcoursetag",
     *      summary="Delete tag from course",
     *      tags={"courses"},
     *      @OA\Parameter(name="id",in="path",required=true,),
     *      @OA\Parameter(name="tag",in="path",required=true),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */

    public function DelCourseTag(Request $request){
        $CourseRespository = new CourseRespository();
        if(isset($request->query()['id']) && isset($request->query()['tag']))
            return $CourseRespository->findByIdAndDeleteTag(new Course(id:$request->query()['id']), $request->query()['tag']);
        else{
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
       /**
     * @OA\PUT(
     *      path="/editcourse",
     *      summary="Edit course",
     *      tags={"courses"},
     *      @OA\Parameter(name="id",in="path",required=true,),
     *      @OA\Parameter(name="title",in="path",required=true,),
     *      @OA\Parameter(name="description",in="path",required=true),
     *      @OA\Parameter(name="content",in="path",required=true),
     *      @OA\Parameter(name="category",in="path",required=true),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public function EditCourse(Request $request){
        $queryparam = $request->query();
        $parametres = ['id','title' ,'subtitle', 'description' ,'category','content'];
        $missingparam = array_filter($parametres, function ($parametre) use ($queryparam) {
            return !isset($queryparam[$parametre]); 
        });
        if(!$missingparam){
            $CourseRespository = new CourseRespository();
            $newCourse = new Course(
                id: $queryparam['id'],
                title: $queryparam['title'],
                subtitle: $queryparam['subtitle'],
                description: $queryparam['description'],
                category: $queryparam['category'],
                content: $queryparam['content']
            );
            return $CourseRespository->findByIdAndUpdate(
                $newCourse 
            );
        }
        else{
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
        
    public function ProjectCourse(Request $request){
        $queryparam = $request->query();
        $parametres = ['id','etat'];
        $missingparam = array_filter($parametres, function ($parametre) use ($queryparam) {
            return !isset($queryparam[$parametre]); 
        });
        if(!$missingparam){
            $CourseRespository = new CourseRespository();
            $newCourse = new Course(
                id: $queryparam['id'],
                isProjected: $queryparam['etat']
            );
            return $CourseRespository->findByIdProject(
                $newCourse 
            );
        }
        else{
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
       /**
     * @OA\DELETE(
     *      path="/delcourse",
     *      summary="Delete specific course",
     *      tags={"courses"},
     *      @OA\Parameter(name="id",in="path",required=true,),
     *      @OA\Response(response="200", description="get all courses"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public function DelCourse(Request $request){
        $CourseRespository = new CourseRespository();
        if(isset($request->query()['id']))
            return $CourseRespository->findByIdAndDelete(new Course(id:$request->query()['id']));
        else
        return [
            "status" => false ,
            "message" => 'Missing parametres'
        ];
    }
}