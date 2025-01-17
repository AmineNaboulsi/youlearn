import { VscDebugStart } from "react-icons/vsc";
import { IoDocumentTextOutline } from "react-icons/io5";
type CourseType = {
    id : number,
    title : string,
    subtitle : string,
    description : string,
    img : string,
    category : string,
    price : number
  }
type propsCourse = {
    course : CourseType ,
    HandledInscriptionCourse : (item:CourseType) => void
}
function Course({course , HandledInscriptionCourse}:propsCourse) {
  return (
    <>
                      <div className="w-full h-full ">
                        <div className="w-full relative group ">
                          <div className="max-w-80 h-80 relative overflow-y-hidden hover:shadow-md cursor-pointer">
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
                                  <ul className="w-full h-full flex flex-col items-end justify-center gap-2 font-titleFont px-2 border-l border-r">
                                      <li
                                      onClick={()=>{
                                        HandledInscriptionCourse(course)
                                      }}
                                      className="text-[#767676] hover:text-primeColor text-sm font-normal border-b-[1px] border-b-gray-200 hover:border-b-primeColor flex items-center justify-end gap-2 hover:cursor-pointer pb-1 duration-300 w-full">
                                          Start Course
                                          <VscDebugStart />
                                      </li>
                                  </ul>
                                </div>
                              </div>
                            <div className="max-w-80 py-4 flex flex-col gap-1 border-[1px] border-t-0 px-2">
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
  )
}

export default Course