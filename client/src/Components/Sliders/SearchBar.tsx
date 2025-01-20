import { IoMdSearch } from "react-icons/io";
import { useState ,useRef } from "react";
type searchType = {
    onCancelSearch : ()=> void,
    onSearch : (courseName:string)=> void
  }
function SearchBar({onCancelSearch , onSearch }:searchType) {
    const [SearchBar , setSearchBar] =useState(''); 
    const containerRef = useRef<HTMLDivElement>(null); 

    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // Check if the click was outside the input container
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            onCancelSearch();
          }
      };

  return (
    <div 
    onClick={handleOutsideClick}
    className="fixed transition-all z-[1] inset-0 backdrop-blur-md">
        <div className="h-[30vh] flex justify-center items-center">
            <div ref={containerRef} className="relative w-[20%] grid grid-cols-1 z-[2]">
                <input 
                    onChange={(e)=>{
                        setSearchBar(e.target.value)
                    }}
                    name="email" type="text"  className="px-2 rounded-md drop-shadow-md  text-black text-sm border-b border-gray-300 focus:border-blue-600 pl-2 pr-8 py-3 outline-none" placeholder="Search Form Course" />
                <div 
                onClick={()=>{
                    if(SearchBar!="") onSearch(SearchBar)
                }}
                className="cursor-pointer absolute right-0 top-0 bottom-0 flex items-center pr-3" >
                    <IoMdSearch />
                </div>
                
            </div>
        </div>
    </div>
  )
}

export default SearchBar