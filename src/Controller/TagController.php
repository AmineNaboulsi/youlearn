<?php

namespace App\Controller;

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
    public function getTags(){
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
    public function AddTag(){
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
    public function EditTag(){
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
    public function DelTag(){
        return [
            "status" => true ,
            "message" => 'DelTag'
        ];
    }
}