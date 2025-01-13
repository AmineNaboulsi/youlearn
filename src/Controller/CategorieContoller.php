<?php

namespace App\Controller;

class CategorieContoller
{

    public  function getCategories()
    {
        return [
            "status" => true ,
            "message" => 'getCategories'
        ];
    }
    public  function AddCategorie()
    {
        return [
            "status" => true ,
            "message" => 'AddCategorie'
        ];
    }
    public  function DelCategorie()
    {
        return [
            "status" => true ,
            "message" => 'DelCategorie'
        ];
    }
    public  function EditCategorie()
    {
        return [
            "status" => true ,
            "message" => 'EditCategorie'
        ];
    }
}