import { useState , useEffect } from 'react';
import CategriePanel from '../../Components/Categories/CategriePanel.tsx'
import CoursesPanel from '../../Components/Courses/CoursePanel.tsx.tsx'
import TagsPanel from '../../Components/Tags/TagPanel.tsx'
import { Link , useNavigate } from 'react-router';
import HeaderDashborad from '../../Components/Nav/HeaderDashborad'
type TagType = {
  id: number,
  title: string
}
type CategorieType = {
    id: number,
    name: string
  }
type CourseType = {
  id : number,
  title : string,
  subtitle : string,
  description : string,
  content : string,
  isprojected : boolean,
  img : string,
  cat_id : number,
  category : string,
  price : number
  contenttype: string | null,
  tags : TagType[]
}

function Page() {

  const [Courses , setCourses] = useState<CourseType[]>([]);
  const [Categories , setCategories] = useState<CategorieType[]>([]);
  const [Tags , setTags] = useState<TagType[]>([]);
  const [Details , setDetails] = useState<CourseType | undefined>(undefined);
  const [mangePiker , setmangePiker] = useState(0);
  const navigate = useNavigate();
  const FetchCourses = async(index:number) =>{
    const url = import.meta.env.VITE_APP_URL;
    const routes = ['/getcourses','/getcategories','/gettags'];
    const res = await fetch(`${url}${routes[index]}`);
    const data = await res.json();
    if(index==0)
        setCourses(data)
    else if( index==1 )
        setCategories(data)
    else setTags(data)
  }
    useEffect(()=>{
        FetchCourses(0);
        
    },[])
    const HandelAdding = () =>{
        if(mangePiker==0)
            navigate('/dashborad/course')
        
    }
    const HandledChangeList = async (index:number) =>{
        setmangePiker(index)
        FetchCourses(index);
    }
  return (
    <div className="bg-gray-100 h-full">
        <HeaderDashborad />
        <section>
          <div className="container">
            <div className="grid grid-cols-[70%,30%] gap-2 mt-5">
                <div className="">
                  <div >
                    <div className="relative overflow-x-auto shadow-md sm:rounded-lg h-[80vh]">
                        <div className="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white ">
                            <div className="px-4">
                                <button 
                                onClick={HandelAdding}
                                data-dropdown-toggle="dropdownAction" className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" type="button">
                                    Add {mangePiker==0 ? 'Course' : mangePiker==1 ? 'Categorie' : 'Tag'}
                                </button>
                            </div>
                            <div className="relative flex items-center pr-3">
                                <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                    </svg>
                                </div>
                                <input type="text" className="block pl-10 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500  dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={`Search for ${mangePiker==0 ? ' course ': mangePiker==0 ? 'categorie':'tag' }`}/>
                            </div>
                        </div>
                        <table className="relative h-52 w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="static top-0 text-xs uppercase  "> 
                                <tr>
                                    <th scope="col" className="px-6 py-3">
                                        Name
                                    </th>
                                    {mangePiker==0 && (<th scope="col" className="px-6 py-3">
                                        Status
                                    </th>)}
                                    
                                    <th scope="col" className="px-6 py-3">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {mangePiker==0 ? 
                                <>{Courses && Courses.map((course:CourseType)=>(
                                    <>
                                      <tr className="bg-white border-b ">
                                          <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                              <img className="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-1.jpg" alt="Jese image" />
                                              <div className="ps-3">
                                                  <div 
                                                  onClick={()=>{
                                                    setDetails(course)
                                                  }}
                                                  className="text-base font-semibold text-gray-500 hover:underline cursor-pointer">{course.title}</div>
                                                  <div className="text-xs font-normal text-gray-500">{course.subtitle}</div>
                                              </div>  
                                          </th>
                                          <td className="px-6 py-4">
                                              <div className="flex items-center">
                                                  <div className={`h-2.5 w-2.5 rounded-full ${course.isprojected ? 'bg-green-500':'bg-red-500'} me-2`}></div>{course.isprojected ? 'Public': 'Private'}
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                            <Link to={`/dashborad/course?id=${course.id}`}>
                                              <span data-modal-target="editUserModal" data-modal-show="editUserModal" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</span>
                                            </Link>
                                          </td>
                                      </tr>
                                    </>
                                  ))}</>
                                : mangePiker==1 ? <>
                                {Categories && Categories.map((categorie:CategorieType)=>
                                    (
                                    <>
                                        <tr className="bg-white border-b ">
                                          <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                              <div className="ps-3">
                                                  <div className="text-base font-semibold text-gray-500 hover:underline cursor-pointer">{categorie.name}</div>
                                              </div>  
                                          </th>
                                          <td className="px-6 py-4">
                                              <a href="#" type="button" data-modal-target="editUserModal" data-modal-show="editUserModal" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
                                          </td>
                                      </tr>
                                    </>
                                ))}
                                </>: <>
                                {Tags && Tags.map((tag:TagType)=>(<>
                                    <>
                                        <tr className="bg-white border-b ">
                                          <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                              <div className="ps-3">
                                                  <div className="text-base font-semibold text-gray-500 hover:underline cursor-pointer">{tag.title}</div>
                                              </div>  
                                          </th>
                                          <td className="px-6 py-4">
                                              <a href="#" type="button" data-modal-target="editUserModal" data-modal-show="editUserModal" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
                                          </td>
                                      </tr>
                                    </>
                                </>))}
                                </>}
                              
                              
                            </tbody>
                        </table>
                    </div>
                  </div>
                </div>
                <div className="">
                    <div className="bg-white rounded-md p-4 text-center">
                      <span >Manage</span>
                      <div className="grid gap-3 mt-2">
                          <div 
                          onClick={()=>{
                            HandledChangeList(0)
                          }}
                          className={`rounded-md border-2 cursor-pointer py-1 ${mangePiker==0 ? 'bg-gray-500 text-white' : 'hover:bg-gray-100' } `} >
                              Courses
                          </div>
                          <div 
                           onClick={()=>{
                            HandledChangeList(1)
                          }}
                          className={`rounded-md border-2 cursor-pointer py-1 ${mangePiker==1 ? 'bg-gray-500 text-white' : 'hover:bg-gray-100 '} `}>
                              Categorie
                          </div>
                          <div 
                           onClick={()=>{
                            HandledChangeList(2)
                          }}
                          className={`rounded-md border-2 cursor-pointer py-1 ${mangePiker==2 ? 'bg-gray-500 text-white' :'hover:bg-gray-100' } `}>
                              Tags
                          </div>
                      </div>
                    </div>
                    <>
                        {Details!=undefined && (
                            <div className="bg-white rounded-md py-4 mt-3">
                            {mangePiker==0 ? <CoursesPanel details={Details} />
                            :
                            mangePiker==1 ? <CategriePanel  />
                            :
                            <TagsPanel  />}
                            </div>
                        )}
                        
                    </>
                </div>
            </div>
          </div>
        </section>
    </div>
  )
}

export default Page