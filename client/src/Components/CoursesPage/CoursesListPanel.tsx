import { useState , useEffect } from 'react';
import AlertInscription from './AlertInscription'
import Course from './Course';
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router';
type CourseType = {
  id : number,
  title : string,
  subtitle : string,
  description : string,
  img : string,
  category : string,
  price : number
}
type CategorieType = {
  id : number,
  name : string
}
function CoursesListPanel() {
  const [Alert, setAlert] = useState(false);
  const [CourseSelected, setCourseSelected] = useState<CourseType | undefined>(
    {
      id : 0,
      title : "",
      subtitle : "",
      description : "",
      img : "",
      category : "",
      price : 0
    }
  );
  const [Categorys, setCategorys] = useState<CategorieType[]>(); 
  const [Courses, setCourses] = useState<CourseType[]>(); 
  const [Logged , isLogged] = useState<boolean | null>(null);
  const navigate = useNavigate();
  useEffect(()=>{
    const FetchCategories = async() =>{
        const url = import.meta.env.VITE_APP_URL;
        const res = await fetch(`${url}/getcategories`);
        const data = await res.json();
        if(data){setCategorys(data);}
    }
    const FetchCourses = async() =>{
      const url = import.meta.env.VITE_APP_URL;
      const res = await fetch(`${url}/getcourses`);
      const data = await res.json();
      if(data){setCourses(data);}
      // console.log(data)
    } 
    const ValidateToken = async () =>{
      const url = import .meta.env.VITE_APP_URL;
      const AuthToken = Cookies.get('auth-token')
      try{
          const res =  await fetch(`${url}/validtk`,{
              method : 'POST',
              headers :
              {
                  Authorization : `Bearer ${AuthToken}`
              }
          });
          const data =  await res.json();
          isLogged(data.status)
          return  ;
      }catch(error){
          // console.log(error)
          return false ;
      }
     
  }
    ValidateToken();
    FetchCategories();
    FetchCourses();

},[])
const HandledInscriptionCourse =  (course:CourseType) => {
  setCourseSelected(course);
  setAlert(true)
}
const onCancelAlert = () =>{
  setAlert(false)
}
  const EnrollUser = async() =>{
    const url = import .meta.env.VITE_APP_URL;
    const AuthToken = Cookies.get('auth-token')
    const formd = new FormData();
    formd.append('id',''+CourseSelected?.id)
    try{
        const res =  await fetch(`${url}/enrollcourse`,{
            method : 'POST',
            body : formd ,
            headers :
            {
                Authorization : `Bearer ${AuthToken}`
            }
        });
        const data =  await res.json();
        // console.log(data)
    }catch(error){
        // console.log(error)
    }
}
const onValideAlert = async(IsEnroll:boolean , isStudent :boolean) =>{
  if(Logged==true){
      if(!IsEnroll) {EnrollUser()}
      if(isStudent){
        navigate(`/course?id=${CourseSelected?.id}`)
      }
      else {
        setAlert(false)
      }
  }
  else navigate('/signin');
}

  return (
    <div className="bg-[#F5F5F3] px-4">
      {Alert && <AlertInscription 
              onCancel={onCancelAlert}
              onValide={onValideAlert}
              Course={CourseSelected}
              Logged={Logged}
              />}
    <div className="mt-3 h-full">
          <div className="relative grid grid-cols-[20%,1fr] gap-5">
            <div className="relative">
              <div className="sticky top-0">
                  <div className="font-semibold text-xl ">Category</div>
                  <div className="py-2 cursor-pointer mt-2  ">
                    <span className="text-gray-900 font-semibold">All</span>
                    <hr />
                  </div>
                  {Categorys ? Categorys.map((item : CategorieType)=>(
                  <div className="py-2 cursor-pointer">
                      <span className="text-gray-500 mb-1 hover:text-gray-900">{item?.name}</span>
                      <hr />
                  </div>
                  
                  )):<>
                   <div className="col-span-4 py-20">
                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                  </div>
                  </>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mdl:gap-4 lg:gap-10">
                {Courses? Courses.map((item :CourseType)=>(
                    <Course 
                      course={item}
                      HandledInscriptionCourse={HandledInscriptionCourse} />
                  )):
                  <>
                  <div className="col-span-4 py-20">
                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                  </div>
                  </>
                }
           </div>
          </div>
          

    </div>
  </div>
  )
}

export default CoursesListPanel