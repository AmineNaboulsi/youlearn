import { FaLock } from "react-icons/fa";
import {Link} from 'react-router-dom'

function Unauthorized() {
  return (
    <div className='h-screen w-full flex gap-6 justify-center items-center flex-col'>
        <FaLock className='h-14 w-14 text-9xl text-gray-500'/>
        <h1 className='text-xl text-black'>Unauthorized access. Please log in.</h1>
        <Link to='/signin'>
            <button 
                type="button" 
                className="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">
                Sign in page
            </button>
        </Link>
    </div>
  )
}

export default Unauthorized