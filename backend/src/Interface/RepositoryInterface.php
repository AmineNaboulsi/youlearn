<?php

namespace App\Interface ;

interface RepositoryInterface {
    
    public function Save($entity); 
    public function findByIdAndUpdate($entity); 
    public function findByIdAndDelete($entity); 
}

?>