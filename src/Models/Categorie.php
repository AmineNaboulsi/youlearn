<?php

namespace App\Models;

class Categorie
{

    public $id;
    public $name;

    public function __construct($id=0, $name="")
    {
        $this->id = $id;
        $this->name = $name;
    }

    public function getId()
    {
        return $this->id;
    }

    public function getName()
    {
        return $this->name;
    }   

}