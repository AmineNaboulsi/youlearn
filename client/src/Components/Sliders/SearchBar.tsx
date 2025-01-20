import { IoMdSearch } from "react-icons/io";
import { useState } from "react";
type searchType = {
    onCancelSearch : ()=> void,
    onSearch : (courseName:string)=> void
  }
function SearchBar({onCancelSearch , onSearch}:searchType) {
    const [SearchBar , setSearchBar] =useState(''); 
  return (
    <div 
    onClick={onCancelSearch}
    className="fixed z-[1] inset-0 border-2 border-red-500 backdrop-blur-sm">
        <div className="h-[30vh] flex justify-center items-center">
            <div className="relative w-[20%] grid grid-cols-1">
                <input 
                onChange={(e)=>{
                    setSearchBar(e.target.value)
                }}
                name="email" type="text"  className="px-2 rounded-md drop-shadow-md  text-black text-sm border-b border-gray-300 focus:border-blue-600 pl-2 pr-8 py-3 outline-none" placeholder="Enter password" />
                <div 
                onClick={()=>onSearch(SearchBar)}
                className="absolute right-0 top-0 bottom-0 flex items-center pr-3" >
                    <IoMdSearch />
                </div>
            </div>
        </div>
    </div>
  )
}

export default SearchBar