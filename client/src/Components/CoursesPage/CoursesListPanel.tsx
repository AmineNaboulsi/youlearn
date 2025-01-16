import React from 'react'
import { useState , useEffect } from 'react';
import { VscDebugStart } from "react-icons/vsc";
import { IoDocumentTextOutline } from "react-icons/io5";

type CourseType = {
  id : number,
  title : string,
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
  const [Categorys, setCategorys] = useState<CategorieType[]>(); 
  const [Courses, setCourses] = useState<CourseType[]>(); 
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
      console.log(data)
  } 
    FetchCategories();
    FetchCourses();
},[])
  return (
    <div className="">
    <div className="font-semibold text-xl mt-3">Category</div>
    <div className="mt-4">
          <div className="py-2 cursor-pointer">
              <span className="text-gray-900 font-semibold">All</span>
              <hr />
          </div>
          <div className="grid grid-cols-[20%,1fr] gap-5">
            <div className="">
              {Categorys && Categorys.map((item : CategorieType)=>(
              <div className="py-2 cursor-pointer">
                  <span className="text-gray-500 mb-1 hover:text-gray-900">{item?.name}</span>
                  <hr />
              </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mdl:gap-4 lg:gap-10">
            {Courses && Courses.map((item :CourseType)=>(
                <>
                  <div className="w-full h-full ">
                    <div className="w-full relative group ">
                      <div className="max-w-80 h-80 relative overflow-y-hidden hover:shadow-md cursor-pointer">
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
                            <div className="w-full h-16 absolute bg-white -bottom-[130px] group-hover:bottom-0 duration-700">
                              <ul className="w-full h-full flex flex-col items-end justify-center gap-2 font-titleFont px-2 border-l border-r">
                                
                                <li className="text-[#767676] hover:text-primeColor text-sm font-normal border-b-[1px] border-b-gray-200 hover:border-b-primeColor flex items-center justify-end gap-2 hover:cursor-pointer pb-1 duration-300 w-full">
                                    Start Course
                                    <VscDebugStart />
                                </li>
                              </ul>
                            </div>
                          </div>
                        <div className="max-w-80 py-4 flex flex-col gap-1 border-[1px] border-t-0 px-2">
                        <div className="flex items-center justify-between font-titleFont">
                          <h2 className="text-md text-primeColor font-bold">{item.title} </h2>
                          <p className="text-[#767676] text-[14px]">FREE</p>
                          </div>
                          <div>
                            <p className="text-[#767676] text-[14px]">Blank and White</p>
                            </div>
                            </div>
                            </div>
                  </div>
                </>
              ))}
           </div>
          </div>
          

    </div>
  </div>
  )
}

export default CoursesListPanel