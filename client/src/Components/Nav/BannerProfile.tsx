import { IoIosNotificationsOutline } from "react-icons/io";
import { useEffect, useState } from 'react';
import Cookie from 'js-cookie'

type UserType = {
    id: number,
    name: string,
    email: string,
    isActive: number,
    role: string,
}

function BannerProfile() {
    const [User , setUser] = useState<UserType | undefined>(undefined);
    useEffect(()=>{
      const FetchUserStatus = async()=>{
        const url = import.meta.env.VITE_APP_URL;
        const token = Cookie.get('auth-token');
        if(token==undefined) {
          await setUser(undefined);
          return;
        }
        const res = await fetch(`${url}/getuser`,{
          headers : {
            Authorization : `Bearer ${token}`
          }
        });
        if(res.status === 404) {
          setUser(undefined);
          return;
        }
        const data = await res.json();
        setUser(data);
      }
      FetchUserStatus();
    },[])
  return (
    <div className="">
        <section className='bg-white'>
            <div className="container px-10">
                <div className="relative h-[160px]">
                    <div className="absolute border-4 bg-white border-gray-300 w-auto -bottom-9 rounded-full">
                        <img className="h-36 w-36 object-cover rounded-full" src="https://plus.unsplash.com/premium_photo-1673866484792-c5a36a6c025e?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
                        {/* <FaRegUser className="h-12 w-12" /> */}
                    </div>
                    <div className="grid grid-cols-[1fr,auto] justify-end items-end h-full">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col ml-44 justify-end h-full pb-2">
                                {User ? (<>
                                    <span className="font-semibold text-2xl text-black">{User && User?.name}</span>
                                    <span className="font-normal text-md text-gray-500">{User && User?.email}</span>
                                </>) : 
                                <div className="">
                                    <div className="col-span-4 py-20">
                                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                    </div>
                                </div>
                                }
                            </div>
                            <IoIosNotificationsOutline size={25} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
  )
}

export default BannerProfile