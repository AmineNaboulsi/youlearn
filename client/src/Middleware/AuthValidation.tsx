import {useState , useEffect} from 'react'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router'

function AuthValidation(Component:any) {
  return function CkeckPerm() {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate()
    useEffect(() => {
        const ValidateToken = async () =>{
            const url = import .meta.env.VITE_APP_URL;
            const AuthToken = Cookies.get('auth-token')
            const res =  await fetch(`${url}/validtk`,{
                method : 'POST',
                headers :
                {Authorization : `Bearer ${AuthToken}`}
            });
            setIsLoading(false);
            if(res.status != 200){
                setIsLoading(false);
                navigate('/signin');
            }   
        }
        ValidateToken();
      }, []);

    if (isLoading){return <>Loading ...</>}
    return <>
        <Component />
        </>
  }
}

export default AuthValidation