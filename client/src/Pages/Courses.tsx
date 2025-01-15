import { useState } from 'react';
import Header from '../Components/Header'
import { Link } from 'react-router';
import { IoMdDocument } from "react-icons/io";

type CourseType = {
  id : number,
  name : string,
  description : string,
  image : string,
  category : string,
  price : number
}

function Courses() {
  const [Courses, setCourses] = useState<CourseType[]>([
    {
      id : 1,
      name : "string",
      description : "string",
      image : "string",
      category : "string",
      price : 44
    }
  ]); 
  return (
    <>
        <Header />
        <section>
            <div className="container mt-10">
                <h2 className=''>Courses to get you started</h2>
                <h3 className=''>Explore courses from experienced, real-world experts.</h3>
            </div>
            <div className="max-w-container mx-auto px-4 bg-[#F5F5F3]">
        
        <h1 className="font-bold text-4xl mt-5">Courses</h1>
        <div className="flex items-center gap-1">
            <div className="">lol</div>
            <span>shop</span>
        </div>
        <div className="grid grid-cols-[25%,1fr] gap-2 mt-5">
          <div className="">
          <div className="">lol</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mdl:gap-4 lg:gap-10">
            {Courses && Courses.map((item :CourseType , index:number)=>(
              <div key={index} className="w-full h-full ">
              <div className="w-full relative group ">
                <div className="max-w-80 h-80 relative overflow-y-hidden hover:shadow-md cursor-pointer">
                    <div className="bg-white h-[100%]">
                      {item.image ? 
                      (<>
                      <img 
                        src={item.image}
                        alt="" />
                      </>)
                      :
                      (<>
                      <div className="w-full h-full object-contain flex justify-center items-center" >
                        <IoMdDocument />
                      </div>
                      </>)
                      }
                      
                    </div>
                    <div className="absolute top-6 left-8">
                      {/* <div className="bg-primeColor w-[92px] h-[35px] text-white flex justify-center items-center text-base font-semibold hover:bg-black duration-300 cursor-pointer">New</div> */}
                      </div>
                      <div className="w-full h-16 absolute bg-white -bottom-[130px] group-hover:bottom-0 duration-700">
                        <ul className="w-full h-full flex flex-col items-end justify-center gap-2 font-titleFont px-2 border-l border-r">
                          
                          <li className="text-[#767676] hover:text-primeColor text-sm font-normal border-b-[1px] border-b-gray-200 hover:border-b-primeColor flex items-center justify-end gap-2 hover:cursor-pointer pb-1 duration-300 w-full">
                            Add to Cart
                              <span>
                                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H159.208l-9.166-44.81C147.758 8.021 137.93 0 126.529 0H24C10.745 0 0 10.745 0 24v16c0 13.255 10.745 24 24 24h69.883l70.248 343.435C147.325 417.1 136 435.222 136 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-15.674-6.447-29.835-16.824-40h209.647C430.447 426.165 424 440.326 424 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-22.172-12.888-41.332-31.579-50.405l5.517-24.276c3.413-15.018-8.002-29.319-23.403-29.319H218.117l-6.545-32h293.145c11.206 0 20.92-7.754 23.403-18.681z">
                                    </path>
                                  </svg>
                              </span>
                          </li>
                          <Link to={`/product?product_id=${item.id}`} >
                              <li className="text-[#767676] hover:text-primeColor text-sm font-normal border-b-[1px] border-b-gray-200 hover:border-b-primeColor flex items-center justify-end gap-2 hover:cursor-pointer pb-1 duration-300 w-full">View Details<span className="text-lg"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M4 18.99h11c.67 0 1.27-.32 1.63-.83L21 12l-4.37-6.16C16.27 5.33 15.67 5 15 5H4l5 7-5 6.99z"></path></svg></span></li>
                          </Link>
                        </ul>
                      </div>
                    </div>
                  <div className="max-w-80 py-6 flex flex-col gap-1 border-[1px] border-t-0 px-4">
                  <div className="flex items-center justify-between font-titleFont">
                    <h2 className="text-lg text-primeColor font-bold">{item.name} </h2>
                    <p className="text-[#767676] text-[14px]">${item.price}</p>
                    </div>
                    <div>
                      <p className="text-[#767676] text-[14px]">Blank and White</p>
                      </div>
                      </div>
                      </div>
            </div>
            ))}
          </div>
        </div>
      </div>
        </section>
    </>
  )

      

}

export default Courses