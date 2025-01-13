<?php

namespace App\Controller;
use App\Models\Tag;
use App\RouterServices\Request;
use App\Rou;

class TagController
{

    /**
     * @OA\Get(
     *      path="/tags",
     *      tags={"Tags"},
     *      summary="Get all tags",
     *      @OA\Response(response="200", description="get all tags"),
     *      @OA\Response(response="404", description="No Data Found"),
     * )
     */

    public function getTags(Request $request){
        $params = ['id'];
        $request->getQueryParams()['id'];
        return [
            "status" => true ,
            "message" => 'getTags'
        ];
    }
     /**
     * @OA\POST(
     *      path="/tags",
     *      tags={"Tags"},
     *      summary="Add tag",
     *      @OA\Response(response="200", description="get all tags"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function AddTag(Request $request){
        if(!isset($request->getQueryParams()['name'])){
            return [
                "status" => false ,
                "message" => 'Missing parametres'
            ];
        }
        $Tag = new Tag();
        $Tag->setName($request->getQueryParams()['name']);

        return [
            "status" => true ,
            "message" => 'AddTag'
        ];
    }
     /**
     * @OA\PUT(
     *      path="/tags",
     *      tags={"Tags"},
     *      summary="Edit Tag",
     *      @OA\Response(response="200", description="Edit Tag"),
     *      @OA\Response(response="404", description="Tag Not Found"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function EditTag(Request $request){
        return [
            "status" => true ,
            "message" => 'EditTag'
        ];
    }
     /**
     * @OA\DELETE(
     *      path="/tags",
     *      tags={"Tags"},
     *      summary="Delete Tag",
     *      @OA\Response(response="200", description="Edit Tag"),
     *      @OA\Response(response="404", description="Tag Not Found"),
     *      @OA\Response(response="422", description="Missing parametres"),
     * )
     */
    public function DelTag(Request $request){
        return [
            "status" => true ,
            "message" => 'DelTag'
        ];
    }
}