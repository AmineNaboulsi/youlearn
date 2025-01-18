<?php

namespace App\Models;

class Course 
{
    
    private int $id;
    private int $instructor;
    private string $title;
    private string $subtitle;
    private string $img;
    private string $description;
    private string $isprojected;
    private int $category;
    private string $content;
    private string $contenttype;
    private array $tags;

    public function __construct($id=0,$instructor=0,$title="", $subtitle="", $description="",$isProjected=1, $category=0,$contenttype="",$content="",$img="", $tags=[]){
        $this->id = $id;
        $this->instructor = $instructor;
        $this->title = $title;
        $this->subtitle = $subtitle;
        $this->isprojected = $isProjected;
        $this->img = $img;
        $this->description = $description;
        $this->content = $content;
        $this->contenttype = $contenttype;
        $this->category = $category;
        $this->tags = $tags;
    }

    public function getId() : int {return $this->id;}
    public function getInstructor() : int {return $this->instructor;}
    public function getTitle() : string { return $this->title;}
    public function getSubTitle() : string { return $this->subtitle;}
    public function getImg() : string { return $this->img;}
    public function isProjected() : int { return $this->isprojected?1:0;}
    public function getDescription() : string {return $this->description;}
    public function getCategory() : int {return $this->category;}
    public function getContent() : string {return $this->content;}
    public function getContentType() : string {return $this->contenttype;}
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