import Header from '../Components/Nav/Header'
import CoursesListPanel from '../Components/CoursesPage/CoursesListPanel'
import { IoMdSearch } from "react-icons/io";
import { useState } from 'react';
import SearchBarPanel from '../Components/Sliders/SearchBar'


function Courses() {
  const [SearchBar , ShowSearchBar] =useState(false); 
  const onCancelSearch = () =>{
    alert("cancel")
  }
  const onSearch = (courseName:string) =>{
    alert(''+courseName)
  }

  return (
    <>
        <Header />
        <section className='h-full'>
          {SearchBar && <SearchBarPanel 
            onCancelSearch={onCancelSearch}
            onSearch={onSearch}
          />}
            <div className="container h-full">
              <div className="max-w-container mx-auto bg-[#F5F5F3]  h-full">
                <div className="flex justify-between items-center pr-10">
                  <div className="">
                    <h1 className="font-bold text-4xl px-3">Courses</h1>
                    <div className="flex items-center gap-1 px-3">
                        <div className="">Home </div>
                        <span>{' > '}Courses</span>
                    </div>
                  </div>
                  <div
                  onClick={()=>ShowSearchBar(!SearchBar)}
                  className="cursor-pointer transition-all border-[1px] border-gray-600 rounded-md hover:scale-110 p-2">
                    <IoMdSearch size={20} />
                  </div>
                </div>
                <CoursesListPanel  />
              </div>
            </div>
        </section>
    </>
  )

      

}

export default Courses