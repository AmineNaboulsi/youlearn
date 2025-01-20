import Header from '../Components/Nav/Header'
import CoursesListPanel from '../Components/CoursesPage/CoursesListPanel'
import { IoMdSearch } from "react-icons/io";
import { useState } from 'react';
import SearchBarPanel from '../Components/Sliders/SearchBar'
import { FaXmark } from "react-icons/fa6";


function Courses() {
  const [SearchBar , ShowSearchBar] =useState(false); 
  const [TriggeredSearch , isTriggeredSearch] =useState(false); 
  const [SearchContent , SetSearchContent] =useState(""); 
  const onCancelSearch = () =>{
    ShowSearchBar(false)
  }
  const onSearch = (courseName:string) =>{
    SetSearchContent(courseName)
    isTriggeredSearch(true)
    ShowSearchBar(false)
  }
  const HandleShowingSearchBar =() =>{
    ShowSearchBar(!SearchBar)
  }
  return (
    <>
        <Header />
        <section className='h-full'>
          {SearchBar && <SearchBarPanel 
            onCancelSearch={onCancelSearch}
            onSearch={onSearch}
          />}
            <div className="container h-full ">
              <div className="max-w-container mx-auto h-full ">
                <div className="flex justify-between items-center pr-10 border-x-[#9a9a9a] border-x-[1px]">
                  <div className="flex flex-col gap-2 mt-3">
                    <h1 className="font-bold text-4xl px-3">Courses</h1>
                    <div className="flex items-center gap-3 px-3">
                        <div className="">Home </div>
                        <span>{' > '}Courses</span>
                    </div>
                  </div>
                  <div
                  onClick={HandleShowingSearchBar}
                  className="cursor-pointer transition-all border-[1px] border-gray-600 rounded-md hover:scale-110 p-2">
                    <IoMdSearch size={20} />
                  </div>
                </div>
                <CoursesListPanel 
                      isTriggeredSearch={isTriggeredSearch} 
                      TriggeredSearch={TriggeredSearch} 
                      CousreName={SearchContent}
                      />
              </div>
            </div>
        </section>
    </>
  )

      

}

export default Courses