import {useRef, useState, useEffect} from 'react';
import useAuth from '../hooks/useAuth';
import {login} from "../services/login.api"
import {Link, useNavigate, useLocation} from 'react-router-dom';

const LOGIN_URL = '/auth/login';

export default function SignIn() {

    const {setAuth} = useAuth();

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

            setAuth({username: user, accessToken: accessToken, roles: roles});
            setUser('');
            setPwd('');
            navigate(from, {replace: true})

        } catch (err: any) {
            if (!err?.response) {
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
        <section className="space-y-4">
            <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
            <div className="space-y-1 text-center">
                <h1 className="text-3xl">Sign in to Eurocup!</h1>
                <p className="text-sm opacity-80">Use your account to continue.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">

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
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
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
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />

                <button id="signin" className='bg-lighter text-white p-2 rounded-lg w-full mt-2'>Sign in</button>
            </form>
            <p className="text-center text-sm">
                Need an Account?<br/>
                <span className="inline-block">
                    <Link to="/signup" className="mt-2 inline-flex items-center justify-center rounded border border-gray-300 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800">
                        Sign Up
                    </Link>
                </span>
            </p>
        </section>

    )
}
