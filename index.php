<?php

require_once realpath(__DIR__ . '/vendor/autoload.php')  ;

use App\RouterServices\RouterServiceProvider;
use App\Controller\UserContoller;
use App\Controller\CourseController;
use App\Controller\TagController;
use App\Controller\CategorieContoller;
use App\MiddleWare\Auth;

$URI = $_SERVER["REQUEST_URI"];
$METHOD = $_SERVER["REQUEST_METHOD"];

$Routes = new RouterServiceProvider($METHOD , $URI);

$Routes->post('/signin' ,UserContoller::class , 'SignIn');
$Routes->post('/signup',UserContoller::class , 'SignUp');
$Routes->post('/activate',UserContoller::class , 'BannedOrUnBanned' , Auth::class , 'admin');

//Courses
$Routes->get('/getcourses' , CourseController::class , 'getCourses');
$Routes->post('/addcourse' , CourseController::class , 'AddCourse', Auth::class , 'enseignant');
$Routes->put('/editcourse' , CourseController::class , 'EditCourse' , Auth::class , 'enseignant');
$Routes->delete('/delcourse' , CourseController::class , 'DelCourse' , Auth::class , 'enseignant');

//Tags
$Routes->get('/gettags' , TagController::class , 'getTags' );
$Routes->post('/addtag' , TagController::class , 'AddTag' , Auth::class , 'admin');
$Routes->put('/edittag' , TagController::class , 'EditTag', Auth::class , 'admin');
$Routes->delete('/deltag' , TagController::class , 'DelTag', Auth::class , 'admin');


//Categorie
$Routes->get('/getcategories' , CategorieContoller::class , 'getCategories' , Auth::class , 'admin');
$Routes->post('/addcategorie' , CategorieContoller::class , 'AddCategorie' , Auth::class , 'admin');
$Routes->put('/editcategorie' , CategorieContoller::class , 'EditCategorie' , Auth::class , 'admin');
$Routes->delete('/delcategorie' , CategorieContoller::class , 'DelCategorie' , Auth::class , 'admin');

$Routes->Dispatch();

?>