<?php

require_once realpath(__DIR__ . '/vendor/autoload.php')  ;

use App\RouterServices\RouterServiceProvider;
use App\Controller\UserContoller;
use App\Controller\CourseController;
use App\Controller\TagController;
use App\Controller\CategorieContoller;
use App\MiddleWare\AuthMiddleware;

$Routes = new RouterServiceProvider;

$Routes->post('/signin' ,UserContoller::class , 'SignIn');
$Routes->post('/signup',UserContoller::class , 'SignUp');
$Routes->patch('/activate',UserContoller::class , 'BannedOrUnBanned' , AuthMiddleware::class , 'admin');

//Courses
$Routes->get('/getcourses' , CourseController::class , 'getCourses');
$Routes->post('/addcourse' , CourseController::class , 'AddCourse', AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->put('/editcourse' , CourseController::class , 'EditCourse' , AuthMiddleware::class , ['enseignant', 'admin']);
$Routes->delete('/delcourse' , CourseController::class , 'DelCourse' , AuthMiddleware::class , ['enseignant', 'admin']);

//Tags
$Routes->get('/gettags' , TagController::class , 'getTags' );
$Routes->post('/addtag' , TagController::class , 'AddTag' , AuthMiddleware::class , 'admin');
$Routes->put('/edittag' , TagController::class , 'EditTag', AuthMiddleware::class , 'admin');
$Routes->delete('/deltag' , TagController::class , 'DelTag', AuthMiddleware::class , 'admin');


//Categorie
$Routes->get('/getcategories' , CategorieContoller::class , 'getCategories' , AuthMiddleware::class , 'admin');
$Routes->post('/addcategorie' , CategorieContoller::class , 'AddCategorie' , AuthMiddleware::class , 'admin');
$Routes->put('/editcategorie' , CategorieContoller::class , 'EditCategorie' , AuthMiddleware::class , 'admin');
$Routes->delete('/delcategorie' , CategorieContoller::class , 'DelCategorie' , AuthMiddleware::class , 'admin');

$Routes->dispatch();

?>