import { useState , useEffect } from 'react';
import CategriePanel from '../../Components/Categories/CategriePanel.tsx'
import CoursesPanel from '../../Components/Courses/CoursePanel.tsx.tsx'
import TagsPanel from '../../Components/Tags/TagPanel.tsx'
import { Link , useNavigate } from 'react-router';
import HeaderDashborad from '../../Components/Nav/HeaderDashborad.tsx'
import Cookies from 'js-cookie'
import { FaRegTrashAlt } from "react-icons/fa";
import { IoStatsChartSharp } from "react-icons/io5";
import PanelStatistics from '../../Components/Statics/PanelStatistics.tsx'
type TagType = {
  id: number,
  title: string
}
type CategorieType = {
    id: number,
    name: string,
    isActive: boolean,
  }
type UserType = {
    id: number,
    email: string,
    name: string,
    isActive: boolean,
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

function Dashborad() {
  const [Courses , setCourses] = useState<CourseType[] | null>([]);
  const [Permed , isPermed] = useState(false);
  const [Admin , isAdmin] = useState(false);
  const [showCategoriePanel , setshowCategoriePanel] = useState(false);
  const [showTagPanel , setshowTagPanel] = useState(false);
  const [Categories , setCategories] = useState<CategorieType[] | null>([]);
  const [Users , setUsers] = useState<UserType[] | null>([]);
  const [Tags , setTags] = useState<TagType[] | null    >([]);
  const [Details , setDetails] = useState<CourseType | undefined>(undefined);
  const [ModeStatics , isModeStatics] = useState(false);

  const [mangePiker , setmangePiker] = useState(0);
  const navigate = useNavigate();
  const FetchCourses = async(index:number) =>{
    const url = import.meta.env.VITE_APP_URL;
    const token = Cookies.get('auth-token');
    setCourses(null)
    setCategories(null)
    setTags(null)
    setUsers(null)
    const routes = ['/getallcourses','/getcategories','/gettags','/getteachers','/getstudents'];
    const res = await fetch(`${url}${routes[index]}`,{
        method : 'GET',
        headers : {Authorization : `Bearer ${token}`}
    });
    const data = await res.json();
    if(data?.status){
        return;
    }
    if(index==0)
        setCourses(data)
    else if( index==1 )
        setCategories(data)
    else if( index==2 )
        setTags(data)
    else 
        setUsers(data)
  }
    useEffect(()=>{
        const CheckPerm = async() =>
        {
            const url = import .meta.env.VITE_APP_URL;
            const AuthToken = Cookies.get('auth-token')
            const res =  await fetch(`${url}/validtk`,{
                method : 'POST',
                headers :
                {
                    Authorization : `Bearer ${AuthToken}`
                }
            });
            const data =  await res.json();
            if(data.role =="admin"){
                // admin
                isAdmin(true)
            }else{
                // teacher
                isAdmin(false)
            }
            HandledChangeList(0)
            isPermed(true)
        }     
        CheckPerm();   
    },[])
    const HandelAdding = () =>{
        if(mangePiker==0)
            navigate('/dashborad/course')
        else if(mangePiker==1)
            {setshowCategoriePanel(true)
            setshowTagPanel(false)}
        else 
        {   setshowTagPanel(true)
                setshowCategoriePanel(false)
        }
    }
    const HandledChangeList = async (index:number) =>{
        setmangePiker(index)
        FetchCourses(index);
        setshowCategoriePanel(false)
        setshowTagPanel(false)
    }
    const RemoveTag = async(id:number) =>{
        const url = import.meta.env.VITE_APP_URL;
        const token = Cookies.get('auth-token')
        const res = await fetch(`${url}/deltag?id=${id}`,{
            method : 'DELETE',
            headers : {
                Authorization : `Bearer ${token}`
            }
        });
        const data = await res.json();
        if(data.status)
            HandledChangeList(2);
    }
    const RemoveCategorie = async(id:number) =>{
        const url = import.meta.env.VITE_APP_URL;
        const token = Cookies.get('auth-token')
        const res = await fetch(`${url}/delcategorie?id=${id}`,{
            method : 'DELETE',
            headers : {
                Authorization : `Bearer ${token}`
            }
        });
        const data = await res.json();
        if(data.status)
            HandledChangeList(2);
    }
    const HandledActivateAccount = async (id:number , isA:boolean) => {
        const url = import.meta.env.VITE_APP_URL;
        const token = Cookies.get('auth-token')
        const res = await fetch(`${url}/activate?id=${id}&etat=${isA?0:1}`,{
            method : 'PATCH',
            headers : {
                Authorization : `Bearer ${token}`
            }
        });
        const data = await res.json();
        if(data.status)
        {
            if(mangePiker==3) HandledChangeList(3)
            if(mangePiker==4) HandledChangeList(4)
        }
            
    }
    const HandledDelUser = async (id:number) => {
        const url = import.meta.env.VITE_APP_URL;
        const token = Cookies.get('auth-token')
        const res = await fetch(`${url}/deluser?id=${id}`,{
            method : 'DELETE',
            headers : {
                Authorization : `Bearer ${token}`
            }
        });
        const data = await res.json();
        if(data.status)
            {
                if(mangePiker==3) HandledChangeList(3)
                if(mangePiker==4) HandledChangeList(4)
            }
    }
    const HanledProjectionControle = async(id:number , projectedEtat:boolean) =>{
        const url = import.meta.env.VITE_APP_URL;
        const token = Cookies.get('auth-token')
        const res = await fetch(`${url}/projectcourse?id=${id}&etat=${projectedEtat?0:1}`,{
            method : 'PATCH',
            headers : {
                Authorization : `Bearer ${token}`
            }
        });
        const data = await res.json();
        if(data.status)
        {
            HandledChangeList(0)
        }
    }
  return (
    <div className="bg-gray-100 h-full">
        <HeaderDashborad />
        {Permed ? 
            <section>
            <div className="container">
            <div className="grid grid-cols-[70%,30%] gap-2 mt-5">
                <div className="">
                    <div >
                    <div className="relative shadow-md sm:rounded-lg h-[70vh]">
                        <div className="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white ">
                            <div className="px-4 flex gap-2 items-center">
                                {mangePiker<=2 && 
                                    <>
                                        {(mangePiker==0 && Admin)? <></> : <>
                                        <button 
                                        onClick={HandelAdding}
                                        data-dropdown-toggle="dropdownAction" className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" type="button">
                                            Add {mangePiker==0 ? 'Course' : mangePiker==1 ? 'Categorie' : 'Tag'}
                                        </button>
                                        </>}
                                    </>
                                }
                                <div 
                                onClick={()=>{
                                    isModeStatics(!ModeStatics)
                                }}
                                className={`cursor-pointer p-2 border-[1px] ${ModeStatics ? ' bg-orange-500 ':' bg-white '} border-orange-500  rounded-lg`}>
                                    <IoStatsChartSharp className={`  ${ModeStatics ? "text-white" : "text-orange-500" }`} />
                                </div>
                            </div>
                            <div className="relative flex items-center pr-3">
                                <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                    </svg>
                                </div>
                                <input type="text" className="block pl-10 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500  dark:placeholder-gray-400  dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={`Search for ${mangePiker==0 ? ' course ': mangePiker==0 ? 'categorie':'tag' }`}/>
                            </div>
                        </div>
                        <div className="h-full overflow-y-auto">
                            {ModeStatics ? 
                            <PanelStatistics />
                            :
                            <table className="relative w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                <thead className="sticky backdrop-blur-sm z-[100] top-0 text-xs uppercase  "> 
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            Name
                                        </th>
                                        {mangePiker==0 && (<th scope="col" className="px-6 py-3">
                                            Status
                                        </th>)}
                                        {mangePiker>2 && 
                                            <th scope="col" className="px-6 py-3">
                                            Email
                                            </th>
                                        }
                                        {mangePiker>2 && 
                                            <th scope="col" className="px-6 py-3">
                                            Active
                                            </th>
                                        }
                                        {(mangePiker==0 && !Admin )&&
                                            <th scope="col" className="px-6 py-3">
                                                Action
                                            </th>
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {mangePiker==0 ? 
                                    <>{Courses ? Courses.map((course:CourseType)=>(
                                        <>
                                        <tr className="relative bg-white border-b ">
                                            <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                                <img className="w-10 h-10 rounded-full" src={course.img} alt="Jese image" />
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
                                                <div onClick={()=>HanledProjectionControle(course.id , course.isprojected)} className="flex items-center cursor-pointer">
                                                    <div className={`h-2.5 w-2.5 rounded-full ${course.isprojected ? 'bg-green-500':'bg-red-500'} me-2`}></div>{course.isprojected ? 'Public': 'Private'}
                                                </div>
                                            </td>
                                            {(mangePiker==0 && !Admin )&&
                                            <td className="px-6 py-4">
                                                <Link to={`/dashborad/course?id=${course.id}`}>
                                                <span data-modal-target="editUserModal" data-modal-show="editUserModal" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</span>
                                                </Link>
                                            </td>
                                            }
                                        </tr>
                                        </>
                                    )):<>
                                    <div className="absolute left-0 right-0 col-span-4 py-20">
                                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1.5em" width="1.4em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                    </div>
                                    </>}</>
                                    : mangePiker==1 ? <>
                                    {Categories ? Categories.map((categorie:CategorieType)=>
                                        (
                                        <>
                                            <tr className="relative bg-white border-b ">
                                            <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                                <div className="ps-3 ">
                                                    <div className="text-base font-semibold text-gray-500  cursor-pointer">{categorie.name}</div>
                                                </div>  
                                            </th>
                                            <td 
                                                onClick={()=>RemoveCategorie(categorie.id)}
                                                className="px-6 py-4 cursor-pointer">
                                                <span 
                                                className="font-medium text-red-600 dark:text-red-500 hover:underline">Remove</span>
                                            </td>
                                        </tr>
                                        </>
                                    )):<>
                                        <div className="absolute left-0 right-0 col-span-4 py-20">
                                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1.5em" width="1.4em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                        </div>
                                    </>}
                                    </>:
                                    mangePiker==2 ? <>
                                        {Tags ? Tags.map((tag:TagType)=>(<>
                                            <>
                                                <tr className="relative bg-white border-b ">
                                                <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                                    <div className="ps-3">
                                                        <div className="text-base font-semibold text-gray-500 hover:underline cursor-pointer">{tag.title}</div>
                                                    </div>  
                                                </th>
                                                <td 
                                                    onClick={()=>RemoveTag(tag.id)}
                                                    className="px-6 py-4 cursor-pointer">
                                                    <span className="font-medium text-red-600 dark:text-red-500 hover:underline">Remove</span>
                                                </td>
                                            </tr>
                                            </>
                                        </>)):<>
                                    <div className="absolute left-0 right-0 col-span-4 py-20">
                                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1.5em" width="1.4em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                    </div>
                                    </>}
                                    </> : <>
                                    {(Users!=undefined) ? Users?.map((user:UserType)=>(<>
                                        <>
                                            <tr className="relative bg-white border-b ">
                                            <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                                <div className="flex items-center">
                                                    <div className="text-base font-semibold text-gray-500 hover:underline cursor-pointer">{user.name}</div>
                                                </div>  
                                            </th>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className={`h-2.5 w-2.5 rounded-full`}>{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                            {user.isActive ? <>
                                                <div onClick={()=>HandledActivateAccount(user.id , user.isActive)} className="flex items-center cursor-pointer">
                                                        <div className={`h-2.5 w-2.5 rounded-full bg-green-500 me-2`}></div>Active
                                                </div>
                                            </>:
                                            <>
                                                <div onClick={()=>HandledActivateAccount(user.id , user.isActive)} className="flex items-center cursor-pointer">
                                                        <div className={`h-2.5 w-2.5 rounded-full bg-red-500 me-2`}></div>No active
                                                </div>
                                            </>}
                                                
                                            </td>
                                            <td onClick={()=>HandledDelUser(user.id)} className="px-6 py-4">
                                                <FaRegTrashAlt className='cursor-pointer text-red-500' />
                                            </td>
                                        </tr>
                                        </>
                                    </>)):<>
                                    <div className="absolute left-0 right-0 col-span-4 py-20">
                                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1.5em" width="1.4em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                    </div>
                                    </>}
                                    </>}
                                
                                
                                </tbody>
                            </table>
                            }
                        </div>
                        
                    </div>
                    </div>
                </div>
                <div className="">
                    <div className="bg-white rounded-md p-4 text-center shadow-md">
                        <span >Manage</span>
                        <div className="grid gap-3 mt-2">
                            <div 
                            onClick={()=>{
                            HandledChangeList(0)
                            }}
                            className={`rounded-md border-2 cursor-pointer py-1 ${mangePiker==0 ? 'bg-gray-500 text-white' : 'hover:bg-gray-100' } `} >
                                Courses
                            </div>
                            {Admin &&
                            <>
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
                                <div 
                                onClick={()=>{
                                HandledChangeList(3)
                                }}
                                className={`rounded-md border-2 cursor-pointer py-1 ${mangePiker==3 ? 'bg-gray-500 text-white' :'hover:bg-gray-100' } `}>
                                    Teachers
                                </div>
                                <div 
                                onClick={()=>{
                                HandledChangeList(4)
                                }}
                                className={`rounded-md border-2 cursor-pointer py-1 ${mangePiker==4 ? 'bg-gray-500 text-white' :'hover:bg-gray-100' } `}>
                                    Students
                                </div>
                            </>
                            }
                        </div>
                    </div>
                    <>
                        {Details!=undefined && (
                            <>
                                {mangePiker==0 && (<>
                                    <div className="bg-white rounded-md py-4 mt-3 ">
                                        <CoursesPanel details={Details} />
                                    </div>
                                </>)}
                            </>
                        )}
                        {
                            showCategoriePanel ? <CategriePanel  />
                            :
                            showTagPanel ? <TagsPanel  /> :<></>}
                        
                    </>
                </div>
            </div>
            </div>
            </section>
        : <div className="col-span-4 py-20">
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        </div>}
        
    </div>
  )

}

export default Dashborad