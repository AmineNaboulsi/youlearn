import {Link , useNavigate} from 'react-router-dom'
import { useState } from 'react';
import Cookies from 'js-cookie'

type CredentialType = {
  name : string ,
  email : string ,
  password : string ,
  status : null | boolean ,
  message : string,
  isLoading : boolean 
}

function SignIn() {
  const nagivate = useNavigate();
  const [credentials , setcredentials] = useState<CredentialType>(
    {
      name : "" ,
      email : "" ,
      password : "" ,
      status : null ,
      message : "",
      isLoading : false
    }
  );
  const HandleSignUp = async(event:any) =>{
      event.preventDefault();
      setcredentials((prev)=>({
        ...prev ,
        status : null ,
        isLoading : true
      }))
      const url = import.meta.env.VITE_APP_URL;
      const params = new FormData();
      params.append("name" , credentials?.password);
      params.append("email" , credentials?.email);
      params.append("password" , credentials?.password);
      try{
          const res = await fetch(`${url}/signin`,{
            method : 'POST',
            body : params
          });
          const data = await res.json();
          console.log(data);
          if(data){
            setcredentials((prev)=>({
              ...prev ,
              status : data.status ,
              message : data.message ,
              isLoading : false
            }))
            if(data?.status) {
              Cookies.set('auth-token', data?.token)
              setTimeout(()=>{
                nagivate('/')
              },200)

            }
          }
          else{
            setcredentials((prev)=>({
              ...prev ,
              status :  false,
              message : 'ERROR' ,
              isLoading : false
            }))
          }
    }catch(error){
      setcredentials((prev)=>({
        ...prev ,
        status :  false,
        message : 'ERROR' ,
        isLoading : false
      }))
    }
  }
  return (
    <div>
        <div className="font-[sans-serif] ">
      <div className="min-h-screen flex flex-col items-center justify-center ">
        <div className="grid md:grid-cols-2 items-center gap-4 max-md:gap-8 h-full w-full rounded-md">
          <div className="w-[100%] h-[90vh] flex justify-center items-center rounded-xl ">
            <img 
            src="https://i.ibb.co/nsbPXP8Y/bg4189.jpg"
            className=" w-[80%] h-[80%] object-cover" alt="login-image" />
          </div>
          <div className="md:max-w-md w-full px-4 py-4">
              <form onSubmit={HandleSignUp}>
                  <div className="mb-6">
                    <h3 className="text-gray-800 text-3xl font-extrabold">Sign in to your account
                    </h3>
                    <p className="text-sm mt-2 text-gray-800">Don't have an account 
                      <Link to="/signup" className="text-blue-600 font-semibold hover:underline ml-1 whitespace-nowrap">
                        Register here
                      </Link>
                    </p>
                  </div>
                    <div className="mt-8">
                      <label className="text-gray-800 text-xs block mb-2">Email</label>
                      <div className="relative flex items-center">
                        <input 
                         onChange={(e)=>{
                          setcredentials((prev)=>({
                            ...prev ,
                            email : e.target.value
                          }))
                        }}
                        name="email" type="text"  className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 pl-2 pr-8 py-3 outline-none" placeholder="Enter password" />
                      </div>
                    </div>

                    <div className="mt-8">
                      <label className="text-gray-800 text-xs block mb-2">Password</label>
                      <div className="relative flex items-center">
                        <input 
                         onChange={(e)=>{
                          setcredentials((prev)=>({
                            ...prev ,
                            password : e.target.value
                          }))
                        }}
                        name="password" type="password"  className="w-full text-gray-800 text-sm border-b border-gray-300 focus:border-blue-600 pl-2 pr-8 py-3 outline-none" placeholder="Enter password" />
                      </div>
                    </div>
                    {credentials.status!= null 
                    &&
                    (
                      <div className={`mt-5 flex items-center p-3  text-sm ${credentials.status ? 'bg-green-200' : 'bg-red-200' } rounded-lg  ${credentials.status ? 'dark:text-green-700': 'dark:text-red-700'  }`} role="alert">
                          <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                          </svg>
                          <span className="sr-only">Info</span>
                          <div>
                              <span className="font-medium">{credentials.message}.</span>
                          </div>
                      </div>
                    )
                    }
                    <div className="mt-5">
                      <button type="submit" className="w-full shadow-xl py-2.5 px-4 text-sm tracking-wide rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                            {
                              credentials.isLoading ? 
                              (
                                <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                                </svg>
                              ):
                              (
                               <> Sign In </>
                              ) 
                            }
                      </button>
                      
                    </div>

                    <div className="my-4 grid grid-cols-[30%,1fr,30%] items-center ">
                      <hr className="w-full border-gray-300" />
                      <p className="text-sm text-gray-800 text-center">Or continue with</p>
                      <hr className="w-full border-gray-300" />
                    </div>

              </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default SignIn