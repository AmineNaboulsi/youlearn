<?php

require_once realpath(__DIR__ . '/vendor/autoload.php')  ;

use App\RouterServices\RouterServiceProvider;
use App\Controller\UserContoller;
use App\Controller\CourseController;
use App\Controller\TagController;
use App\Controller\CategorieContoller;

$URI = $_SERVER["REQUEST_URI"];
$METHOD = $_SERVER["REQUEST_METHOD"];
$Routes = new RouterServiceProvider($METHOD , $URI);
$Routes->post('/signin' ,UserContoller::class , 'SignIn');
$Routes->post('/signup',UserContoller::class , 'SignUp');
$Routes->post('/activate',UserContoller::class , 'BannedOrUnBanned');

//Courses
$Routes->get('/getcourses' , CourseController::class , 'getCourses' );
$Routes->post('/addcourse' , CourseController::class , 'AddCourse' );
$Routes->put('/editcourse' , CourseController::class , 'EditCourse' );
$Routes->delete('/delcourse' , CourseController::class , 'DelCourse' );

//Tags
$Routes->get('/gettags' , TagController::class , 'getTags' );
$Routes->post('/addtag' , TagController::class , 'AddTag' );
$Routes->put('/edittag' , TagController::class , 'EditTag' );
$Routes->delete('/deltag' , TagController::class , 'DelTag' );


//Categorie
$Routes->get('/getcategories' , CategorieContoller::class , 'getCategories' );
$Routes->post('/addcategorie' , CategorieContoller::class , 'AddCategorie' );
$Routes->put('/editcategorie' , CategorieContoller::class , 'EditCategorie' );
$Routes->delete('/delcategorie' , CategorieContoller::class , 'DelCategorie' );


$Routes->Dispatch();

?>