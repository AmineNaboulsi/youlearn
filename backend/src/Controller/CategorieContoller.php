<?php

namespace App\Controller;

use App\RouterServices\Request;
use App\Repository\CategorieRepository;
use App\Models\Categorie;
class CategorieContoller
{
    /**
     * @OA\GET(
     *      path="/getcategories",
     *      summary="Get all categories",
     *      tags={"Categories"},
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=false,
     *          description="ID of the category",
     *          @OA\Schema(
     *              type="integer"
     *          )
     *      ),
     *      @OA\Response(response="200", description="get all categories"),
     *      @OA\Response(response="404", description="No Data Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public  function getCategories(Request $request)
    {
        $RepositoryCategorie = new CategorieRepository();
        if(isset($request->query()['id']))
            return $RepositoryCategorie->findById($request->query()['id']);
        else
            return $RepositoryCategorie->Find();
    }
    /**
     * @OA\POST(
     *      path="/addcategorie",
     *      summary="Add Categorie",
     *      tags={"Categories"},
    * @OA\RequestBody(
    *          required=true,
    *          description="Category data in form-data format",
    *          @OA\MediaType(
    *              mediaType="multipart/form-data",
    *              @OA\Schema(
    *                  type="object",
    *                  @OA\Property(
    *                      property="name",
    *                      type="string",
    *                      description="Category name",
    *                      example="My Category"
    *                  )
    *              )
    *          )
    *      ),
     *      @OA\Response(response="200", description="Add Categorie"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public  function AddCategorie(Request $request)
    {
        $formData = $request->bodyFormData();
        
        $parametres = ["name"];
        $missingparam = array_filter($parametres , function($parametre){
            if(!isset($_POST[$parametre])) {
                return $parametre;
            }
        });
        if(!$missingparam){
            $name = $formData["name"];
            $CategorieRepository = new CategorieRepository();
            return $CategorieRepository->save(new Categorie(name: $name));
          
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
     *      path="/editcategorie",
     *      summary="Edit Categorie",
     *      tags={"Categories"},
     *@OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=true,
     *          description="Id of the category",
     *          @OA\Schema(
     *              type="integer"
     *          )
     *      ),
     * @OA\Parameter(
     *          name="name",
     *          in="path",
     *          required=true,
     *          description="category name  ",
     *          @OA\Schema(
     *              type="string"
     *          )
     *      ),
     *      @OA\Response(response="200", description="Edit Categorie"),
     *      @OA\Response(response="404", description="No Categorie Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    public  function EditCategorie(Request $request)
    {
        $CategorieRepository = new CategorieRepository();
        if(isset($request->query()['name']) && isset($request->query()['id'])){
            return $CategorieRepository->findByIdAndUpdate(new Categorie(name: $request->query()['name'] ,id: $request->query()['id']));
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
     *      path="/delcategorie",
     *      summary="Delete Categorie",
     *      tags={"Categories"},
     * @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=true,
     *          description="Id of the category",
     *          @OA\Schema(
     *              type="integer"
     *          )
     *      ),
     *      @OA\Response(response="200", description="Delete Categorie"),
     *      @OA\Response(response="404", description="No Categorie Found"),
     *      @OA\Response(response="409", description="Failed to make operation"),    
     * )
     */
    
     public  function DelCategorie(Request $request)
     {
         $CategorieRepository = new CategorieRepository();
         if(isset($request->query()['id'])){
             return $CategorieRepository->findByIdAndDelete(new Categorie(id: $request->query()['id']));
         }else{
             http_response_code(422);
             return [
                 "status" => false ,
                 "message" => 'Missing parametres'
             ];
         }
     }
}