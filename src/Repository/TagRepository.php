<?php

namespace App\Repository;
use App\Models\Tag;
use App\Config\Database;

class TagRepository
{
        // Find Tag by ID
        public function findById(int $id) {
            $con = Database::getConnection();
            $sql = "SELECT * FROM tags WHERE id = ?";
        }
        public function Find() {

        }
        // Save Tag to database
        public function Save(Tag $Tag) {

        }
    
        // Update Tag from database
        public function findByIdAndUpdate(Tag $Tag): array {
            return [];
        }
    
        public function findByIdAndUpdateProject(Tag $Tag): array {
            return [];
        }
    
    
        // Delete Tag from database
        public function findByIdAndDelete(Tag $Tag): array {
            return [];
        }

}