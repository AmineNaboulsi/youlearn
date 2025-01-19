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
  const [User , setUser] = useState<UserType | undefined | string>(undefined);
  useEffect(()=>{
    const FetchUserStatus = async()=>{
      const url = import.meta.env.VITE_APP_URL;
      const token = Cookie.get('auth-token');
      if(token==undefined) {
        await setUser("null");
        return;
      }
      const res = await fetch(`${url}/getuser`,{
        headers : {
          Authorization : `Bearer ${token}`
        }
      });
      if(res.status === 404) {
        setUser("null");
        return;
      }
      const data = await res.json();
      setUser(data);
    }
    FetchUserStatus();
  },[])
  return (
       <>
       {User=="null" && (<>
        <nav className="bg-white text-center text-white border-gray-200 dark:bg-gray-900 py-2">
              <span>
                  YouLearn is coming to Las Vegas, April 9-11. Register now to get over 50% off new Courses. 😎
              </span>
            </nav>
       
       </>) }
            
        <section className='border-b-[1px] border-gray-300 h-[72.5px] shadow-md'>
            <div className="container flex justify-between items-center h-full ">
               <span className='font-bold text-xl'>YouLearn</span>
              {User==undefined ?
              <>
                <div className="flex gap-4">
                      <svg aria-hidden="true" className="w-8 h-5 text-gray-200 animate-spin  fill-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                      </svg>
               </div>
              </>
              :<>
              {User=="null" ?
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
                <Link to={User?.role=="etudiant" ? '/profile':'/dashborad' }>
                  <button 
                      type="button" 
                      className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2 text-center  dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">
                      {User?.role=="etudiant" ? 'Profile':'Dashborad' }
                  </button>
                </Link>
                  <button 
                  onClick={()=>{
                    Cookie.remove('auth-token');
                    setUser("null");
                    navigate('/signin');
                  }}
                      type="button" 
                      className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2 text-center  dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">
                      Sign out
                  </button>
               </div>
              </>}
              </>}
               
            </div>
        </section>
           
            
       </>
  )
}

export default Header