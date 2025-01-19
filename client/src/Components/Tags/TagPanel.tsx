import { useState } from "react"
import Cookies from 'js-cookie'

type RApiType = {
  status : string ,
  message : string
}
function Page() {
  const [Name , setName] = useState<string>();
  const [ApiResponse , setApiResponse] = useState<RApiType | null>(null);
  const AddCategorie = async() =>{
    const url = import.meta.env.VITE_APP_URL;
    const authtoken = Cookies.get('auth-token');
    const form = new FormData()
    form.append('name' , ''+Name);
    const res = await fetch(`${url}/addtag`,{
      method : 'POST',
      body: form,
      headers : {
        Authorization : `Bearer ${authtoken}`
      }
    });
    const data = await res.json();
    setApiResponse(data)
  }
  return (
    <div className="p-4 rounded-md mt-2 bg-white shadow-md">
      <h3>Add Tag</h3>
       <div className="mt-6">
       <div className="w-full max-w-sm min-w-[200px]">
            <div className="relative">
                <input 
                onChange={e=>setName(e.target.value)}
                value={Name}
                type="text" className="w-full pl-3 pr-3 py-2 bg-transparent placeholder:text-slate-400 text-slate-600 text-sm border border-slate-200 rounded-md transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow" placeholder="Name" />
                  {ApiResponse && 
                <>
                  <p className={`flex items-start mt-2 text-xs ${ApiResponse.status ? 'text-green-700':'text-red-400' }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1.5">
                      <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
                    </svg>
                    {ApiResponse?.message}.
                  </p>  
                </>
                }
                  
              </div>
            </div>
            <div className="flex justify-end">
              <button 
              onClick={AddCategorie}
              className="mt-2 bg-transparent hover:bg-blue-500 text-slate-600 font-semibold hover:text-white py-1 px-4 border border-slate-600   hover:border-transparent rounded">
                Save
              </button>
            </div>
        </div>
    </div>
  )
}

export default Page