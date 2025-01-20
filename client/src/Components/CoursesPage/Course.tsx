import { VscDebugStart } from "react-icons/vsc";
import { IoDocumentTextOutline } from "react-icons/io5";
import { IoVideocam } from "react-icons/io5";
import { IoIosDocument } from "react-icons/io";

type TagType = {
  id: number,
  title: string
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
    instructor : string,
    price : number
    contenttype: string | null,
    tags : TagType[]
  }
type propsCourse = {
    course : CourseType ,
    HandledInscriptionCourse : (item:CourseType) => void
}
function Course({course , HandledInscriptionCourse}:propsCourse) {
  return (
    <>
                      <div className="w-full h-full shadow-md rounded-md">
                        <div className="w-full relative group ">
                          <div
                          onClick={()=>{
                            HandledInscriptionCourse(course)
                          }}
                          className="max-w-80 h-64 relative overflow-y-hidden hover:shadow-md cursor-pointer">
                              <div 
                              className="absolute top-2 right-2">
                                {
                                  course.contenttype=='video' ? 
                                  <div className="flex items-center gap-2 bg-green-50 p-1 rounded-md border-[1px]">
                                    <IoVideocam className="text-green-900"/>
                                    <span className="text-xs text-green-900">video</span>
                                  </div>:
                                  <div className="flex items-center gap-2 bg-green-50 p-1 rounded-md border-[1px]">
                                    <IoIosDocument />
                                    <span className="text-xs">document</span>
                                  </div> 
                                }
                              </div>
                              
                              {course.img ? 
                              <>
                              <div className="bg-white h-[100%]">
                                <img 
                                  className="w-full h-full object-cover" 
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
                                <div className="w-full h-10 absolute bg-white -bottom-[130px] group-hover:bottom-0 duration-700">
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
                              </div>
                              <div>
                                <div className="flex justify-between pr-2">
                                    <p className="text-[#767676] text-[14px]">
                                      <strong>Instructor :</strong>
                                      <span>{course.instructor}</span>
                                    </p>
                                     <p className="text-[#767676] text-[14px]">{course.price==0 ?'FREE' : `$ ${course.price}` }</p>
                                </div>
                                </div>
                                </div>
                                </div>
                      </div>
                    </>
  )
}

export default Course