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
type PaginationType ={
  count : number ,
  pages : number,
  nbvisible : number,
  limit : number,
  currentpage :number
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
    });
    const [Pagination , setPagination] = useState<PaginationType>({
      count : 0 ,
      pages : 0 ,
      nbvisible : 4 ,
      limit : 6 ,
      currentpage : 0
    })
    const [Categorys, setCategorys] = useState<CategorieType[]>(); 
    const [Courses, setCourses] = useState<CourseType[]>(); 
    const [Logged , isLogged] = useState<boolean | null>(null);
    const navigate = useNavigate();
    const FetchCourses = async() =>{
      try{
        setCourses(undefined);
        const url = import.meta.env.VITE_APP_URL;
        const res = await fetch(`${url}/getcourses?limit=${Pagination.limit}&offset=${Pagination.currentpage * Pagination.limit}`);
        const data = await res.json();
        if(Pagination.currentpage==0) {
          setPagination((prev)=>({
              ...prev ,
              count : data.count ,
              pages : Math.ceil(data.count / prev.limit)
          }));
          setCourses(data.courses);
        }else{
          setPagination((prev)=>({
            ...prev ,
            pages : (prev.count / prev.limit) > Math.ceil(prev.count / prev.limit) ? Math.ceil(prev.count / prev.limit)+1:Math.ceil(prev.count / prev.limit) 
          }));
          setCourses(data);
        }
      }catch{
        setCourses([]);
      }
    } 
    useEffect(()=>{
      const FetchCategories = async() =>{
          const url = import.meta.env.VITE_APP_URL;
          const res = await fetch(`${url}/getcategories`);
          const data = await res.json();
          if(data){setCategorys(data);}
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
            console.log(error)
            return false ;
        }
      
    }
      ValidateToken();
      FetchCategories();
    },[])
    useEffect(() => {
      FetchCourses();
    }, [Pagination.currentpage]);
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
          console.log(data)
      }catch(error){
          console.log(error)
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
    const HandlePages = (page:number) =>{
      setPagination((prev)=>({
        ...prev ,
        currentpage : page-1
      }));
      console.log(Pagination)
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
            <div className="">
              <div className="flex justify-center">
                  <div>
                    <nav className="isolate select-none inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <span
                          onClick={()=>{
                            if(Pagination.currentpage>0){
                              console.log('currentpage : '+Pagination.currentpage + ' count :' + Pagination.pages)
                              setPagination(prev=>({
                                ...prev ,
                                currentpage : prev.currentpage-1
                              }))
                            }
                          }}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                          <span className="sr-only">Previous</span>
                          <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon">
                            <path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
                          </svg>
                        </span>
                      {/* {Array.from({ length: Pagination.pages }, (_, i) => i + 1).map((page:number,i:number)=>(
                          <>
                          {Pagination.pages<=6 ?<>
                            <span 
                            onClick={()=>HandlePages(page)}
                            className="cursor-pointer relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                            {page}
                            </span>
                          
                          </> :  (i< Pagination.currentpage -1 && i> Pagination.currentpage +1 )
                          ? <>
                              <span 
                              onClick={()=>HandlePages(page)}
                              className="cursor-pointer relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                              {page}
                              </span>
                            </> : (i> Pagination.pages) ? <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span> :
                            <></>
                          }
                          </>
                      ))} */}
                       {Array.from({ length: Pagination.pages }, (_, i) => i + 1).map((page:number)=>(
                          <>
                          <span 
                            onClick={()=>HandlePages(page)}
                            className={`${Pagination.currentpage == page-1 ? 'bg-slate-500 text-gray-100 ' : 'text-gray-900  '} cursor-pointer relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0`}>
                            {page}
                            </span>
                          </>
                      ))}
                      <span
                      onClick={()=>{
                        if(Pagination.currentpage<Pagination.pages-1){
                          console.log('currentpage : '+Pagination.currentpage + ' count :' + Pagination.pages)
                          setPagination(prev=>({
                            ...prev ,
                            currentpage : prev.currentpage+1
                          }))
                        }
                      }}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                          <span className="sr-only">Next</span>
                          <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon">
                            <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                          </svg>
                      </span>
                    </nav>
                  </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mdl:gap-4 lg:gap-10">
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
  </div>
  )
}

export default CoursesListPanel