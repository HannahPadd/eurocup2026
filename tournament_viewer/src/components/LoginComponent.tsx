import { useRef, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { login } from "../services/login.api"
import { useNavigate, useLocation } from 'react-router-dom';

const LOGIN_URL = '/auth/login';

export default function SignIn() {

    const { setAuth } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState('');
    const [pwd, setPwd] = useState('');
    const [errMsg, setErrMsg] = useState('');


    useEffect(() => {
        setErrMsg('');
    }, [user, pwd])


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

        try {
            const response = await login({
                username: user,
                password: pwd
            }, LOGIN_URL);
            const accessToken = response?.data.access_token;
            const roles = response?.data?.roles;

            setAuth({ username: user, accessToken: accessToken, roles: roles});
            setUser('');
            setPwd('');
            navigate(from, { replace: true })

        } catch(err: any) {
            if(!err?.response) {
                setErrMsg('No Server response');
            } else if (err.response?.status === 400) {
                setErrMsg('Missing Username or Password');
            } else if (err.response?.status === 401) {
                setErrMsg('Unauthorized');
            } else {
                setErrMsg('Login Failed');
            }
            //errRef?.current.focus();
        }
    }

    return (
            <section>
                <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                <h1>Sign in</h1>
                <form onSubmit={handleSubmit}>

                    <label htmlFor='username' className="block mb-1">Username:</label>
                    <input 
                        type="text"
                        name="username"
                        id="username"
                        ref={userRef}
                        autoComplete="off"
                        onChange={(e) => setUser(e.target.value)}
                        value={user}
                        required
                    />

                    <label htmlFor='password' className="block mb-1">Password:</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        autoComplete="off"
                        onChange={(e) => setPwd(e.target.value)}
                        value={pwd}
                        required
                    />

                    <button id="signin" className='bg-lighter text-white p-2 rounded-lg w-full mt-2'>Sign in</button>
                </form>
                <p>
                    Need an Account?<br />
                    <span className="line">
                        {/*TODO: Link to Create account */}
                        <a href="#">Sign Up</a>
                    </span>
                </p>
            </section>
        
    )
}