import { useEffect , useState } from "react"
import { Link } from "react-router"

type categoryType = {
    id : number,
    name : string
}
function CoursesList() {
    const [Categorys , setCategorys ] = useState<categoryType[]>([]);
    useEffect(()=>{
        const FetchCategories = async() =>{
            const url = import.meta.env.VITE_APP_URL;
            const res = await fetch(`${url}/getcategories`);
            const data = await res.json();
            if(data){setCategorys(data);}
        }
        FetchCategories();
    },[])
  return (
    <section>
        <div className="container">
            <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
                <ul className="flex flex-wrap -mb-px">
                <>
                        {Categorys.slice(0, 4).map((course, i) => (
                            <li key={i} className="me-2">
                            <span
                                aria-current="page"
                                className="cursor-pointer inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-700"
                            >
                                {course.name}
                            </span>
                            </li>
                        ))}
                        {Categorys.length > 4 && (
                            <Link to='courses'>
                                <li className="me-2">
                                    <span
                                        aria-current="page"
                                        className="inline-block p-4 border-b-2 border-transparent rounded-t-lg text-blue-500 cursor-pointer hover:underline  "
                                        onClick={() => console.log('See More clicked')}
                                    >
                                        See More...
                                    </span>
                                </li>
                            </Link>
                            
                        )}
                        </>
                </ul>
            </div>
        </div>
    </section>
  )
}

export default CoursesList