<?php

namespace App\Controller;
use App\Models\Tag;
use App\RouterServices\Request;
use App\Repository\TagRepository;

class TagController
{

    /**
     * @OA\Get(
     *      path="/gettags",
     *      tags={"Tags"},
     *      summary="Get all tags",
     *      @OA\Response(response="200", description="get all tags"),
     *      @OA\Response(response="404", description="No Data Found"),
     * )
     */

    public function getTags(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->getQueryParams()['id'])){
            return $RepositoryTag->findById($request->getQueryParams()['id']);
        }else{
            return $RepositoryTag->Find();
        }
    }
     /**
     * @OA\POST(
     *      path="/addtag",
     *      tags={"Tags"},
     *      summary="Add tag",
     *      @OA\Response(response="200", description="get all tags"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function AddTag(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->getQueryParams()['name'])){
            return $RepositoryTag->save(new Tag($request->getQueryParams()['name']));
        }else{
            http_response_code(422);
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
     /**
     * @OA\PUT(
     *      path="/edittag",
     *      tags={"Tags"},
     *      summary="Edit Tag",
     *      @OA\Response(response="200", description="Edit Tag"),
     *      @OA\Response(response="404", description="Tag Not Found"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function EditTag(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->getQueryParams()['title']) && isset($request->getQueryParams()['id'])){
            return $RepositoryTag->findByIdAndUpdate(new Tag($request->getQueryParams()['title'] , $request->getQueryParams()['id']));
        }else{
            http_response_code(422);
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
     /**
     * @OA\DELETE(
     *      path="/deltag",
     *      tags={"Tags"},
     *      summary="Delete Tag",
     *      @OA\Response(response="200", description="Edit Tag"),
     *      @OA\Response(response="404", description="Tag Not Found"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function DelTag(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->getQueryParams()['id'])){
            return $RepositoryTag->findByIdAndDelete(new Tag(null, $request->getQueryParams()['id']));
        }else{
            http_response_code(422);
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
}