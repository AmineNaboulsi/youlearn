<?php

namespace App\Controller;

class CourseController
{
    
    public function getCourses(){
        return [
            "status" => true ,
            "message" => 'getCourses'
        ];
    }
    public function AddCourse(){
        return [
            "status" => true ,
            "message" => 'AddCourse'
        ];
    }
    public function EditCourse(){
        return [
            "status" => true ,
            "message" => 'EditCourse'
        ];
    }
    public function DelCourse(){
        return [
            "status" => true ,
            "message" => 'DelCourse'
        ];
    }
}