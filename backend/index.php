<?php

require_once realpath(__DIR__ . '/vendor/autoload.php')  ;

use App\RouterServices\RouterServiceProvider;
use App\Controller\UserContoller;
use App\Controller\CourseController;
use App\Controller\TagController;
use App\Controller\CategorieContoller;
use App\MiddleWare\AuthMiddleware;

header('Access-Control-Allow-Origin : *');
header('Access-Control-Allow-Headers : *');
header('Access-Control-Allow-Methods: *');
$Routes = new RouterServiceProvider;

$Routes->post('/signin' ,UserContoller::class , 'SignIn');
$Routes->post('/signup',UserContoller::class , 'SignUp');
$Routes->post('/validtk',UserContoller::class , 'Validtk' );
$Routes->patch('/activate',UserContoller::class , 'BannedOrUnBanned' , AuthMiddleware::class , 'admin');
$Routes->delete('/deluser' , UserContoller::class , 'DelUser', AuthMiddleware::class , 'admin');
//User

$Routes->get('/getuser' , UserContoller::class , 'getUser');
$Routes->get('/getteachers' , UserContoller::class , 'getTeachers', AuthMiddleware::class , 'admin');
$Routes->get('/getstudents' , UserContoller::class , 'getStudents', AuthMiddleware::class , 'admin');

//Courses
$Routes->get('/getenrollcourses' , CourseController::class , 'EnrollCourses', AuthMiddleware::class , 'etudiant');
$Routes->get('/getcourses' , CourseController::class , 'getCourses');
$Routes->get('/search' , CourseController::class , 'Search');
$Routes->get('/getallcourses' , CourseController::class , 'getAllCourses', AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->post('/addcourse' , CourseController::class , 'AddCourse', AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->patch('/projectcourse' , CourseController::class , 'ProjectCourse', AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->post('/addcoursetag' , CourseController::class , 'AddCourseTag', AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->delete('/delcoursetag' , CourseController::class , 'DelCourseTag', AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->put('/editcourse' , CourseController::class , 'EditCourse' , AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->delete('/delcourse' , CourseController::class , 'DelCourse' , AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->post('/enrollcourse' , CourseController::class , 'Enrollcourse' , AuthMiddleware::class ,'etudiant');
$Routes->get('/isenrollcourse' , CourseController::class , 'isEnrollcourse' , AuthMiddleware::class ,['enseignant', 'admin','etudiant']);

//Tags
$Routes->get('/gettags' , TagController::class , 'getTags' );
$Routes->post('/addtag' , TagController::class , 'AddTag' , AuthMiddleware::class , 'admin');
$Routes->put('/edittag' , TagController::class , 'EditTag', AuthMiddleware::class , 'admin');
$Routes->delete('/deltag' , TagController::class , 'DelTag', AuthMiddleware::class , 'admin');


//Categorie
$Routes->get('/getcategories' , CategorieContoller::class , 'getCategories' );
$Routes->post('/addcategorie' , CategorieContoller::class , 'AddCategorie' , AuthMiddleware::class , 'admin');
$Routes->put('/editcategorie' , CategorieContoller::class , 'EditCategorie' , AuthMiddleware::class , 'admin');
$Routes->delete('/delcategorie' , CategorieContoller::class , 'DelCategorie' , AuthMiddleware::class , 'admin');

$Routes->dispatch();

?>