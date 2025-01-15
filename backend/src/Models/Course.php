<?php

namespace App\Models;

class Course 
{
    
    private int $id;
    private string $title;
    private string $description;
    private string $category;
    private string $content;
    private array $tags;

    public function __construct($id=0, $title="", $description="", $category="",$content="", $tags=[]){
        $this->id = $id;
        $this->title = $title;
        $this->description = $description;
        $this->content = $content;
        $this->category = $category;
        $this->tags = $tags;
    }

    public function getId() : int {return $this->id;}
    public function getTitle() : string { return $this->title;}
    public function getDescription() : string {return $this->description;}
    public function getCategory() : string {return $this->category;}
    public function getContent() : string {return $this->content;}
    public function getTags() : array {return $this->tags;}

    public function setId($id){$this->id = $id;}
    public function setTitle($title){$this->title = $title;}
    public function setDescription($description){$this->description = $description;}
    public function setCategory($category){$this->category = $category;}
    public function setContent($content){$this->content = $content;}
    public function setTags($tags){
        is_array($tags) &&  $this->tags = $tags;
    }

}