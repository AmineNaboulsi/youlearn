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
     *      @OA\Response(response="409", description="Failed to make operation"),
     *      @OA\Response(response="404", description="No Data Found"),
     * )
     */
    public function getTags(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->query()['id'])){
            return $RepositoryTag->findById($request->query()['id']);
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
     *      @OA\Response(response="409", description="Failed to make operation"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function AddTag(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->query()['name'])){
            return $RepositoryTag->save(new Tag($request->query()['name']));
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
     *      @OA\Response(response="409", description="Failed to make operation"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function EditTag(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->query()['title']) && isset($request->query()['id'])){
            return $RepositoryTag->findByIdAndUpdate(new Tag($request->query()['title'] , $request->query()['id']));
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
     *      @OA\Response(response="409", description="Failed to make operation"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function DelTag(Request $request){
        $RepositoryTag = new TagRepository();
        if(isset($request->query()['id'])){
            return $RepositoryTag->findByIdAndDelete(new Tag(null, $request->query()['id']));
        }else{
            http_response_code(422);
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
    }
}