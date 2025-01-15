import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router'
import Cookie from 'js-cookie'

interface UserType {
    id: number,
    name: string,
    email: string,
    isActive: number,
    role: string,
}

function Header() {
  const navigate = useNavigate()
  const [User , setUser] = useState<UserType | null>(null);
  useEffect(()=>{
    const FetchUserStatus = async()=>{
      const url = import.meta.env.VITE_APP_URL;
      const token = Cookie.get('auth-token');
      if(!token) return;
      const res = await fetch(`${url}/getuser`,{
        headers : {
          Authorization : `Bearer ${token}`
        }
      });
      if(res.status === 404) return;
      const data = await res.json();
      setUser(data);
      console.log(data);
    }
    FetchUserStatus();
  },[])
  return (
       <>
        <nav className="bg-white text-center text-white border-gray-200 dark:bg-gray-900 py-2">
              <span>
                  YouLearn is coming to Las Vegas, April 9-11. Register now to get over 50% off new Courses. 😎
              </span>
            </nav>
        <section className='border-b-[1px] border-gray-300 h-[72.5px] shadow-md'>
            <div className="container flex justify-between items-center h-full ">
               <span className='font-bold text-xl'>YouLearn</span>
              {User==null ?
              <>
              <div className="flex gap-4">
                <Link to='/signin'>
                  <button 
                      type="button" 
                      className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2 text-center  dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">
                      Sign in
                  </button>
                </Link>
                <Link to='/signup'>
                  <button 
                      type="button" 
                      className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2 text-center  dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">
                      Sign up
                  </button>
                </Link>
               </div>
              </>
              :
              <>
              <div className="flex gap-4">
                <Link to='/profile'>
                  <button 
                      type="button" 
                      className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2 text-center  dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">
                      Profile
                  </button>
                </Link>
                  <button 
                  onClick={()=>{
                    Cookie.remove('auth-token');
                    setUser(null);
                    navigate('/signin');
                  }}
                      type="button" 
                      className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2 text-center  dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">
                      Sign out
                  </button>
               </div>
              </>}
               
            </div>
        </section>
           
            
       </>
  )
}

export default Header