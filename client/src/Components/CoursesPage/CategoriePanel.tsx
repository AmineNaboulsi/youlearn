import React from 'react'

function CategoriePanel() {
    const [categories , setcategories] = useState<CategorieType[]>();
      useEffect(()=>{
            const FetchCategories = async() =>{
                const url = import.meta.env.VITE_APP_URL;
                const res = await fetch(`${url}/getcategories`);
                const data = await res.json();
                if(data){setcategories(data);}
            }
            FetchCategories();
        },[])
  return (
    <div className="">
        <div className="font-semibold text-xl ">Shop by Category</div>
        <div className="mt-4">
                <div className="py-2 cursor-pointer">
                    <span className="text-gray-900 font-semibold">All</span>
                    <hr />
                </div>
            {categories && categories.map((item : CategorieType)=>(
                <div className="py-2 cursor-pointer">
                    <span className="text-gray-500 mb-1 hover:text-gray-900">{item?.Name}</span>
                    <hr />
                </div>
            ))}
        </div>
        </div>
  )
}

export default CategoriePanel