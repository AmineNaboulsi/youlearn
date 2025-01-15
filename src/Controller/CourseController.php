<?php

namespace App\Controller;
use App\Models\Course;
use App\RouterServices\Request;
use App\Repository\CourseRespository;

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
            return $CourseRespository->findById($request->query()['id']);
        else
            return $CourseRespository->Find();
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
        $parametres = ['title' , 'description' ,'category','content','tags'];
        $missingparam = array_filter($parametres, function ($parametre) use ($formData) {
            return !isset($formData->$parametre); 
        });
        if(!$missingparam){
            if(count($formData->tags)<=3){
                http_response_code(422);
                return [
                    "status" => false ,
                    "message" => 'Tags are requied ,minimum is 3'
                ];
            }
            $CourseRespository = new CourseRespository();
            $newCourse = new Course(
                title: $formData->title,
                description: $formData->description,
                category: $formData->category,
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
        $parametres = ['id' , 'tag'];
        $missingparam = array_filter($parametres, function ($parametre) use ($formData) {
            return !isset($_POST[$parametre]); 
        });
        if(!$missingparam){
            return $CourseRespository->findByIdAndAddTag(new Course(id: $formData['id']), tag: $formData['tag']);
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
        $parametres = ['id','title' , 'description' ,'category','content'];
        $missingparam = array_filter($parametres, function ($parametre) use ($queryparam) {
            return !isset($queryparam[$parametre]); 
        });
        if(!$missingparam){
            $CourseRespository = new CourseRespository();
            $newCourse = new Course(
                id: $queryparam['id'],
                title: $queryparam['title'],
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