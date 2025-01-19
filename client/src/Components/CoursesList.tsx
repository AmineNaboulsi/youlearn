import { useEffect , useState } from "react"
import { Link } from "react-router"
import { IoDocumentTextOutline } from "react-icons/io5";
type categoryType = {
    id : number,
    name : string
}
type CourseType = {
    id : number,
    title : string,
    subtitle : string,
    description : string,
    img : string,
    category : string,
    price : number
}

function CoursesList() {
    const [Categorys , setCategorys] = useState<categoryType[]>([]);
    const [Courses, setCourses] = useState<CourseType[]>(); 
    const [CategorysSelected, setCategorysSelected] = useState<string>(""); 
    useEffect(()=>{
        
        const FetchCategories = async() =>{
            const url = import.meta.env.VITE_APP_URL;
            const res = await fetch(`${url}/getcategories`);
            const data = await res.json();
            if(data){setCategorys(data);
                setCategorysSelected(data[0].category)
            }
            // console.log(CategorysSelected)
        }
        const FetchCourses = async() =>{
            const url = import.meta.env.VITE_APP_URL;
            const res = await fetch(`${url}/getcourses`);
            const data = await res.json();
            if(data){setCourses(data);}
            // console.log(data)
        } 
          FetchCategories();
          FetchCourses();
    },[])
  return (
    <section>
        <div className="container">
            <div className="">
            <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
                <ul className="flex flex-wrap -mb-px">
                <>
                        {Categorys.slice(0, 4).map((course) => (
                            <li key={course.id} className="me-2">
                            <span
                                aria-current="page"
                                className="cursor-pointer inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-700"
                            >
                                {course.name}
                            </span>
                            </li>
                        ))}
                        {Categorys.length > 4 && (
                            <Link to='courses'>
                                <li  className="me-2">
                                    <span
                                        aria-current="page"
                                        className="inline-block p-4 border-b-2 border-transparent rounded-t-lg text-blue-500 cursor-pointer hover:underline  "
                                        onClick={() => console.log('See More clicked')}
                                    >
                                        See More...
                                    </span>
                                </li>
                            </Link>
                            
                        )}
                        </>
                </ul>
            </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mdl:gap-4 lg:gap-10 mt-2 ">
                            {Courses ? Courses.slice(0,2)
                                // .filter(course => course.category.includes(CategorysSelected))
                                .map((item :CourseType)=>(
                                <>
                                  <div key={item.id} className="w-full h-full border-[1px]">
                                    <div className="w-full relative group ">
                                      <div className="max-w-full h-28 relative overflow-y-hidden hover:shadow-md cursor-pointer">
                                          {item.img ? 
                                          <>
                                          <div className="bg-white h-[100%]">
                                            <img 
                                              className="w-full h-full object-contain" 
                                              src={item.img}
                                              alt="" />
                                          </div>
                                          </>
                                          :
                                          <>
                                          <div className="bg-white h-[100%] grid justify-center items-center ">
                                              <IoDocumentTextOutline size={70} className='opacity-10' />
                                          </div>
                                          </>}
                                          
                                          <div className="absolute top-6 left-8">
                                            </div>
                                          
                                          </div>
                                        <div className="max-w-full py-4 flex flex-col gap-1  border-t-0 px-2">
                                        <div className="flex items-center justify-between font-titleFont">
                                          <h2 className="text-md text-primeColor font-bold">{item.title} </h2>
                                          </div>
                                          <div>
                                            </div>
                                            </div>
                                            </div>
                                  </div>
                                </>
                              )) : 
                                <div className="col-span-4 py-20">
                                    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                </div>
                              }
                           </div>
            </div>
        
        </div>
    </section>
  )
}

export default CoursesList