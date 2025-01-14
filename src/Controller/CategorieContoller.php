<?php

namespace App\Controller;

use App\RouterServices\Request;

class CategorieContoller
{

    public  function getCategories(Request $request)
    {

        return [
            "status" => true ,
            "message" => 'getCategories'
        ];
    }
    public  function AddCategorie(Request $request)
    {
        return [
            "status" => true ,
            "message" => 'AddCategorie'
        ];
    }
    public  function DelCategorie(Request $request)
    {
        return [
            "status" => true ,
            "message" => 'DelCategorie'
        ];
    }
    public  function EditCategorie(Request $request)
    {
        return [
            "status" => true ,
            "message" => 'EditCategorie'
        ];
    }
}