import { createUser } from '../services/user.api';
import { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const USER_REGEX = /^[A-Za-z0-9-\_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const EMAIL_REGEX = /^[\w.-]+@([\w-]+\.)+[\w-]{2,}$/;


export default function RegisterCompontent() {

    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState('');
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);

    const [email, setEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);

    const [pwd, setPwd] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    //const [matchFocus, setMatchFocus] = useState(false);

    const [grooveStatsApi, setGrooveStatsApi] = useState('');
    const [validGrooveStatsApi, setValidGrooveStatsApi] = useState(false);
    const [grooveStatsApiFocus, setGrooveStatsApiFocus] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    /*
    useEffect(() => {
        userRef.current.focus();
    }, [user])
    */

    useEffect(() => {
        const result = USER_REGEX.test(user);
        setValidName(result);
    }, [user])

    useEffect(() => {
        const result = PWD_REGEX.test(pwd);
        setValidPwd(result);
        const match = pwd === matchPwd;
        setValidMatch(match)
    }, [pwd, matchPwd])

    useEffect(() => {
        const result = EMAIL_REGEX.test(email);
        setValidEmail(result);
    }, [email])

    useEffect(() => {
        //const result = grooveStatsApi;
        setValidGrooveStatsApi(true);
    }, [grooveStatsApi])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        //Validate form data
        const vname = USER_REGEX.test(user);
        const vpwd = PWD_REGEX.test(pwd);
<<<<<<< HEAD
        const vpwdmatch = matchPwd;
=======
        const vpwdmatch = pwd === matchPwd;
>>>>>>> origin/main
        const vemail = EMAIL_REGEX.test(email);

        if (!vname) {
            setErrMsg("Username must be 4-24 characters and start with a letter.");
            return;
        }
        if (!vemail) {
            setErrMsg("Email address is invalid.");
            return;
        }
        if (!vpwd) {
            setErrMsg("Password must be 8-24 chars with upper, lower, number, and !@#$%.");
            return;
        }
        if (!vpwdmatch) {
            setErrMsg("Passwords do not match.");
            return;
        }
        
        try {
            await createUser({
                username: user,
                email: email,
                password: pwd,
                grooveStatsApi: grooveStatsApi
            });
            setSuccess(true);
        } catch (error: any) {
            setSuccess(false);
            setErrMsg(error?.message || "Unable to create user.");
        }
    }

/*
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createPlayer(formData);
    }
        */

    return (
        <>
            {success ? (
                <section>
                    <h1>Success!</h1>
                    <p>
<<<<<<< HEAD
                        {/*TODO
                        Redirect to player page*/}
                        <a href="/login">Sign in</a>
=======
                        <Link to="/login" className="mt-2 inline-flex items-center justify-center rounded border border-gray-300 px-3 py-1 text-xs text-gray-900 hover:bg-gray-100">
                            Sign in
                        </Link>
>>>>>>> origin/main
                    </p>
                </section>
            ) : (
            <section className="w-full flex justify-center px-4">
                <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
                    <div>
                        <label htmlFor='playername' className="block mb-1">
                            Player Name:
                            <span className={validName ? "valid" : "hide"}>
                                <FontAwesomeIcon icon={faCheck} />
                            </span>
                            <span className={validName || !user ? "hide" : "invalid"}>
                                <FontAwesomeIcon icon={faTimes} />
                            </span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            ref={userRef}
                            autoComplete="off"
                            onChange={(e) => setUser(e.target.value)}
                            maxLength={20}
                            required
                            aria-invalid={validName ? "false" : "true"}
                            aria-describedby="uidnote"
                            onFocus={() => setUserFocus(true)}
                            onBlur={() => setUserFocus(false)}
                        />
                        <p id="uidnote" className={userFocus && user && !validName ? "instructions" : "offscreen"}>
                            4 to 24 characters.<br />
                        </p>
                    </div>

                    <div>
                        <label htmlFor='email' className="block mb-1">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="off"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            maxLength={50}
                            aria-invalid={validEmail ? "false" : "true"}
                            aria-describedby="emailnote"
                            onFocus={() => setEmailFocus(true)}
                            onBlur={() => setEmailFocus(false)}
                        />
                        <p id="emailnote" className={emailFocus && !validEmail ? "instructions" : "offscreen"}>
                            Email is invalid.<br />
                        </p>
                    </div>

                    <div>
                        <label htmlFor='password' className="block mb-1">
                            Password:
                            <span className={validPwd ? "valid" : "hide"}>
                                <FontAwesomeIcon icon={faCheck} />
                            </span>
                            <span className={validPwd || !pwd ? "hide" : "invalid"}>
                                <FontAwesomeIcon icon={faTimes} />
                            </span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onChange={(e) => setPwd(e.target.value)}
                            maxLength={24}
                            required
                            aria-invalid={validPwd ? "false" : "true"}
                            aria-describedby="pwdnote"
                            onFocus={() => setPwdFocus(true)}
                            onBlur={() => setPwdFocus(false)}
                        />
                        <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                            8 to 24 characters.<br />
                            Must include Uppercase and lowercase, number and special character.<br />
                            Allowed special characters: !@#$%
                        </p>
                    </div>

                    <div>
                        <label htmlFor='matchpassword' className="block mb-1">
                            Confirm Password:
                            <span className={validMatch && matchPwd ? "valid" : "hide"}>
                                <FontAwesomeIcon icon={faCheck} />
                            </span>
                            <span className={validMatch || !matchPwd ? "hide" : "invalid"}>
                                <FontAwesomeIcon icon={faTimes} />
                            </span>
                        </label>
                        <input
                            type="password"
                            id="matchpassword"
                            name="matchpassword"
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onChange={(e) => setMatchPwd(e.target.value)}
                            maxLength={24}
                            required
                            aria-invalid={validMatch ? "false" : "true"}
                            aria-describedby="matchnote"
                            //onFocus={() => setMatchFocus(true)}
                            //onBlur={() => setMatchFocus(false)}
                        />
                        <p id="matchnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                            Passwords don't match.<br />
                        </p>
                    </div>

                    <div>
                        <label htmlFor='groovestatsapi' className="block mb-1">groovestatsApi:</label>
                        <input
                            type="text"
                            id="groovestatsapi"
                            name="groovestatsapi"
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="off"
                            required
                            onChange={(e) => setGrooveStatsApi(e.target.value)}
                            maxLength={50}
                            aria-invalid={validGrooveStatsApi ? "false" : "true"}
                            aria-describedby="groovestatsapinote"
                            onFocus={() => setGrooveStatsApiFocus(true)}
                            onBlur={() => setGrooveStatsApiFocus(false)}
                        />
                        <p id="groovestatsapinote" className={grooveStatsApiFocus && !validGrooveStatsApi ? "instructions" : "offscreen"}>
                            Api key is not valid.<br />
                        </p>
                    </div>

                    <div>
                        <button 
                        disabled={!validName || !validEmail || !validPwd || !validMatch ? true : false}
                        className="bg-lighter text-white p-2 rounded-lg w-full mt-2">
                            Sign up!
                        </button>
                    </div>
                    <p>
                        Already registered?<br />
                        <span className="">
                            <Link to="/login" className="mt-2 inline-flex items-center justify-center rounded border border-gray-300 px-3 py-1 text-xs text-gray-900 hover:bg-gray-100">
                                Sign in
                            </Link>
                    </span>
                    </p>
                </form>

<<<<<<< HEAD
                <p>
                    Already registered?<br />
                    <span className="">
                        {/*TODO
                        Redirect to login page*/}
                        <a href="/login">Sign in</a>
                    </span>
                </p>
=======
>>>>>>> origin/main

            </section>
            )}
        </>
    )
}
