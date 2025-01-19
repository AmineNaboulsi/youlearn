import { useNavigate } from "react-router";
function HeaderDashborad() {
  const navigate = useNavigate();
  const Exit = () =>{
    // navigate(-1);
    navigate('/courses');
  }

  return (
    <section className="shadow-md bg-white">
        <div className='container'>
            <div className=" py-3 flex justify-between">
                <h2>Dashboard</h2>
                <button 
                onClick={Exit}
                type="button" 
                className="text-gray-900 hover:text-white border border-red-800 hover:bg-red-900 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2 text-center  dark:border-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-800">
                Exit Dashboard
            </button>
            </div>
        
        </div>
    </section>
  )
}

export default HeaderDashborad