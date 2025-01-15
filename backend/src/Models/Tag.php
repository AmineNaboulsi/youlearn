<?php

namespace App\Models;

class Tag
{
    private $name;
    private $id;

    public function __construct($name = null, $id = null)
    {
        $this->name = $name;
        $this->id = $id;
    }
    
    public function getName()
    {
        return $this->name;
    }

    public function setName($name)
    {
        $this->name = $name;
    }

    public function getId()
    {
        return $this->id;
    }

    public function setId($id)
    {
        $this->id = $id;
    }   
}