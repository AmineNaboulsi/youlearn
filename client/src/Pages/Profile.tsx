import BannerProfile from '../Components/Nav/BannerProfile'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router'
import Cookie from 'js-cookie'
import { IoEyeSharp } from "react-icons/io5";
import { IoDocumentTextOutline } from "react-icons/io5";
type CourseType = {
  cat_id :number,
  content :string,
  contenttype:string,
  description:string ,
  id: number,
  img:string,
  instructor:string,
  isprojected:boolean,
  price:number,
  subtitle:string,
  tags:[],
  title:string
}
function Profile() {
  const navigate = useNavigate()
  const [Courses , setCourses] = useState<CourseType[ ] | undefined >(undefined);
  useEffect(()=>{
    const FetchUserStatus = async()=>{
      const url = import.meta.env.VITE_APP_URL;
      const token = Cookie.get('auth-token');
      if(token==undefined) {
        await setCourses(undefined);
        return;
      }
      const res = await fetch(`${url}/getenrollcourses`,{
        headers : {
          Authorization : `Bearer ${token}`
        }
      });
      if(res.status === 404) {
        setCourses(undefined);
        return;
      }
      const data = await res.json();
      setCourses(data);
    }
    FetchUserStatus();
  },[])

  return (
    <div className='bg-gray-100 h-full'>
      <BannerProfile />
      <section className="mt-16 bg-gray-100">
            <div className="container px-10">
                <span className="font-semibold">My Courses</span>
                <div className="grid justify-center">
                  <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-10 mdl:gap-4 lg:gap-10">
                  {Courses ? 
                    Courses.map((course)=>(
                      <>
                      <div className="w-full h-full ">
                            <div className="w-full relative group ">
                              <div className="max-w-64 h-52 relative overflow-y-hidden hover:shadow-md cursor-pointer">
                                  {course.img ? 
                                  <>
                                  <div className="bg-white h-[100%]">
                                    <img 
                                      className="w-full h-full object-contain" 
                                      src={course.img}
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
                                    <div className="w-full h-16 absolute bg-white -bottom-[130px] group-hover:bottom-0 duration-700">
                                      <ul className="w-full h-full flex flex-col items-center justify-center gap-2 font-titleFont px-2 border-l border-r">
                                          <li
                                              className="text-[#767676] hover:text-primeColor text-sm font-normal  flex items-center justify-end gap-2 hover:cursor-pointer pb-1 duration-300 w-full">
                                              <div className="flex items-center gap-1">
                                                  <IoEyeSharp />
                                                  <span>View </span>
                                              </div>

                                          </li>
                                      </ul>
                                    </div>
                              </div>
                                <div className="max-w-64 py-4 flex flex-col gap-1 border-[1px] border-t-0 px-2">
                                <div className="flex items-center justify-between font-titleFont">
                                  <h2 className="text-md text-primeColor font-bold">{course.title} </h2>
                                  <p className="text-[#767676] text-[14px]">FREE</p>
                                  </div>
                                  <div>
                                    <p className="text-[#767676] text-[14px]">Blank and White</p>
                                    </div>
                                    </div>
                                    </div>
                          </div>
                      </>
                    ))
                    :
                    <div className="">
                    <div className="col-span-4 py-20">
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    </div>
                  </div>}
                  </div>
                </div>
               
            </div>
        </section>
    </div>
  )
}

export default Profile