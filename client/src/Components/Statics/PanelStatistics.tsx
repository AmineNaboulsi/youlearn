import { useEffect, useState } from "react"
import Cookies from 'js-cookie'
import { MdKeyboardArrowDown } from "react-icons/md";
type StatisticsType ={
    isloading : boolean ,
    totalcourses : number,
    totalenrolls : number
}
type usertype={
    name:string,
    email:string,
    date:string ,
    users : Array<usertype>
}
type coursetype={
    name:string,
    users : Array<usertype>
}
type usersEnrollestype ={
    name:string,
    users : Array<usertype>
}
function PanelStatistics() {
    const [ usersEnrolles , setusersEnrolles] =useState<usersEnrollestype[] | undefined>(undefined);
    const [ Statistics , setStatistics] =useState<StatisticsType>({
        isloading : true ,
        totalcourses : 0,
        totalenrolls : 0
    });
    useEffect(()=>{
        const FetchStatistics = async() =>{
            const url = import.meta.env.VITE_APP_URL;
            const token = Cookies.get('auth-token');
            const res = await fetch(`${url}/getstatistics`,{
                method : 'GET' ,
                headers : {
                    Authorization : `Bearer ${token}`
                }
            })
            const data = await res.json();
            setStatistics({
                isloading : false ,
                totalcourses : data?.totalcourses,
                totalenrolls : data?.totalenrolls
            })
            setusersEnrolles(data.users)
            console.log(data.users)
        }
        FetchStatistics();
    },[])
  return (
    <div className="p-3">
        <div className="grid grid-cols-2 gap-4">
            <div className="relative bg-white border-[1px] border-gray-200 flex flex-col gap-2 px-8 py-3 rounded-md">
                <span className="text-md">Total Enrolls</span>
                {Statistics?.isloading ? 
                <svg aria-hidden="true" className="inline w-4 h-4 text-gray-200 animate-spin fill-gray-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                : 
                <span className="font-bold text-xl">{Statistics.totalenrolls}</span>
                }
            </div>
            <div className=" bg-white border-[1px] border-gray-200 flex flex-col gap-2 px-8 py-3 rounded-md">
                <span className="text-md">Total Courses</span>
                    {Statistics?.isloading ? 
                    <svg aria-hidden="true" className="inline w-4 h-4 text-gray-200 animate-spin fill-gray-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    : 
                    <span className="font-bold text-xl">{Statistics.totalcourses}</span>
                    }
            </div>
           
        </div>
        <div className="h-[40vh] overflow-y-auto mt-3 px-2">
            {(usersEnrolles && usersEnrolles?.length>0) ? usersEnrolles?.map((course:coursetype,index:number)=>(
                <div className="">
                 <details className="group w-full">
                    <summary className="cursor-pointer text-lg font-semibold text-gray-800 flex justify-between items-center px-6 py-4 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-all">
                        {`${index==0 ? '🥇' : index==1 ? '🥈' : index==2 ? '🥉' : ' '} ${course?.name}`}
                        <span className="ml-2 transition-transform group-open:rotate-180"><MdKeyboardArrowDown /></span>
                    </summary>
                    <div className="overflow-hidden transition-max-height duration-500 ease-in-out max-h-0 group-open:max-h-screen w-full px-6 py-4 border border-gray-300 mt-3 rounded-lg shadow-sm bg-white">
                        <table className="w-full table-auto divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                    >
                                        Name
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                    >
                                        Email
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                    >
                                        Enroll Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {course?.users?.map((user:usertype, index:number) => (
                                    <tr
                                        key={index}
                                        className={`${
                                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        }`}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {user?.name || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {user?.email || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {user?.date || "N/A"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>


                </div>
            )):(usersEnrolles && usersEnrolles?.length==0) ? 
            <div className="flex flex-col justify-center">
                <div className="grid justify-center items-center">
                    <img className="ml-3 h-24" 
                    src="https://i.ibb.co/5h5JL6tL/nodata.png"
                     alt=""/>
                    <span>no Data Found</span>
                </div>
            </div>:<>Loading ... </>}
        </div>
        
    </div>
  )
}

export default PanelStatistics