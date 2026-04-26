import {
  createUser,
  getRegistrationPrefill,
  RegistrationPrefill,
} from "../services/user.api";
import { useRef, useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Division } from "../models/Division";
import {
  buildRegistrationDivisionOptions,
} from "../utils/registrationDivisionOptions";

const USER_REGEX = /^[A-Za-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const EMAIL_REGEX = /^[\w.-]+@([\w-]+\.)+[\w-]{2,}$/;

const normalizeName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function RegisterCompontent() {
  const userRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  const [user, setUser] = useState("");
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);

  const [matchPwd, setMatchPwd] = useState("");
  const [validMatch, setValidMatch] = useState(false);

  const [country, setCountry] = useState("");

  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionIds, setSelectedDivisionIds] = useState<number[]>([]);
  const [divisionLoading, setDivisionLoading] = useState(false);

  const [prefillLoading, setPrefillLoading] = useState(false);
  const [registrationPrefill, setRegistrationPrefill] =
    useState<RegistrationPrefill | null>(null);
  const [lookupAlert, setLookupAlert] = useState<{
    type: "success" | "warning";
    message: string;
  } | null>(null);
  const registrationDivisionOptions = useMemo(
    () => buildRegistrationDivisionOptions(divisions),
    [divisions],
  );

  const errorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  useEffect(() => {
    if (step === 1) {
      userRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    setValidName(USER_REGEX.test(user));
  }, [user]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  const loadDivisions = async () => {
    setDivisionLoading(true);
    try {
      const response = await axios.get<Division[]>("divisions");
      setDivisions(response.data ?? []);
    } catch (error) {
      console.error("Error loading divisions:", error);
    } finally {
      setDivisionLoading(false);
    }
  };

  useEffect(() => {
    loadDivisions();
  }, []);

  useEffect(() => {
    if (!registrationPrefill) return;

    const preferred = registrationPrefill.preferredDivisions.map(normalizeName);
    if (preferred.length === 0) return;

    const ids = divisions
      .filter((division) => {
        const normalizedDivision = normalizeName(division.name);
        return preferred.some(
          (name) =>
            normalizedDivision === name ||
            normalizedDivision.includes(name) ||
            name.includes(normalizedDivision),
        );
      })
      .map((division) => division.id);

    if (ids.length > 0) {
      setSelectedDivisionIds(ids);
    }
  }, [divisions, registrationPrefill]);

  useEffect(() => {
    setErrMsg("");
  }, [step, user, email, pwd, matchPwd, country]);

  const toggleDivisionGroup = (divisionIds: number[]) => {
    setSelectedDivisionIds((prev) =>
      divisionIds.every((id) => prev.includes(id))
        ? prev.filter((id) => !divisionIds.includes(id))
        : [...new Set([...prev, ...divisionIds])],
    );
  };

  const validateAccountFields = (): boolean => {
    const vname = USER_REGEX.test(user);
    const vemail = EMAIL_REGEX.test(email);
    const vpwd = PWD_REGEX.test(pwd);
    const vpwdmatch = pwd === matchPwd;

    if (!vname) {
      setErrMsg(
        'Username must be 3-23 characters and use letters, numbers, "-" or "_".',
      );
      return false;
    }
    if (!vemail) {
      setErrMsg("Email address is invalid.");
      return false;
    }
    if (!vpwd) {
      setErrMsg(
        "Password must be 8-24 chars with upper, lower, number, and !@#$%.",
      );
      return false;
    }
    if (!vpwdmatch) {
      setErrMsg("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateAccountFields()) return;

    setPrefillLoading(true);
    setLookupAlert(null);
    try {
      const prefill = await getRegistrationPrefill(user);
      setRegistrationPrefill(prefill);
      if (prefill.country) {
        setCountry(prefill.country);
      }
      setLookupAlert({
        type: "success",
        message: `Ticket registration found${prefill.ticketCode ? ` (${prefill.ticketCode})` : ""}.`,
      });
      setStep(2);
    } catch (error: unknown) {
      const message = errorMessage(
        error,
        "Unable to validate preregistration gamer tag.",
      );
      setRegistrationPrefill(null);
      setLookupAlert({
        type: "warning",
        message:
          message === "No preregistration found for this gamer tag"
            ? "No ticket registration found for this gamer tag. You can still create your account."
            : "Could not verify ticket registration right now. You can still create your account.",
      });
      setStep(2);
    } finally {
      setPrefillLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAccountFields()) return;

    try {
      await createUser({
        username: user,
        email,
        password: pwd,
        country,
        divisionId: selectedDivisionIds,
      });
      setSuccess(true);
      navigate("/login", {
        replace: true,
        state: { alert: "Registration complete. Please sign in." },
      });
    } catch (error: unknown) {
      setSuccess(false);
      setErrMsg(errorMessage(error, "Unable to create user."));
      errRef.current?.focus();
    }
  };

  const handleBackToStepOne = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStep(1);
    setLookupAlert(null);
  };

  return (
    <>
      {success ? (
        <section>
          <h1>Success!</h1>
          <p>
            <Link
              to="/login"
              className="mt-2 inline-flex items-center justify-center rounded border border-white/60 px-3 py-1 text-xs text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </p>
        </section>
      ) : (
        <section className="w-full flex flex-col items-center gap-4 px-4">
          <p
            ref={errRef}
            className={errMsg ? "errmsg" : "offscreen"}
            aria-live="assertive"
            tabIndex={-1}
          >
            {errMsg}
          </p>

          <form
            onSubmit={step === 1 ? handleLookup : handleSubmit}
            className="w-full max-w-sm mx-auto space-y-4 rounded-xl border border-white/20 bg-black/20 p-4"
          >
            <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-wider">
              <span
                className={
                  step === 1 ? "font-bold text-white" : "text-white/60"
                }
              >
                1. Account
              </span>
              <span className="text-white/40">/</span>
              <span
                className={
                  step === 2 ? "font-bold text-white" : "text-white/60"
                }
              >
                2. Confirm
              </span>
            </div>

            {step === 2 && lookupAlert && (
              <div
                className={`rounded-md border p-3 text-sm ${
                  lookupAlert.type === "success"
                    ? "border-green-400/70 bg-gradient-to-br from-green-500/15 to-green-300/5 text-white shadow-[0_0_0_1px_rgba(74,222,128,0.2)]"
                    : "border-yellow-400/60 bg-yellow-400/10 text-white"
                }`}
              >
                {lookupAlert.type === "success" && registrationPrefill && (
                  <>
                    <div className="text-base font-semibold leading-tight">
                      Preregistration found
                    </div>
                    <div className="mt-1 text-white/90">
                      {lookupAlert.message}
                    </div>
                    <div className="mt-2 text-white/90">
                      Gamer tag: {registrationPrefill.gamerTag ?? "Unknown"}
                    </div>
                    <div className="text-white/90">
                      Ticket code: {registrationPrefill.ticketCode ?? "Unknown"}
                    </div>
                    <div className="text-white/90">
                      Attending as:{" "}
                      {registrationPrefill.attendingAs ?? "Unknown"}
                    </div>
                  </>
                )}
                {lookupAlert.type !== "success" && (
                  <div>{lookupAlert.message}</div>
                )}
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <label htmlFor="username" className="block mb-1">
                    Player Name / User name:
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
                    value={user}
                    maxLength={20}
                    required
                    aria-invalid={validName ? "false" : "true"}
                    aria-describedby="uidnote"
                    onFocus={() => setUserFocus(true)}
                    onBlur={() => setUserFocus(false)}
                  />
                  <p
                    id="uidnote"
                    className={
                      userFocus && user && !validName
                        ? "instructions"
                        : "offscreen"
                    }
                  >
                    3 to 23 characters. Letters, numbers, "-" and "_" only.
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className="block mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    maxLength={50}
                    aria-invalid={validEmail ? "false" : "true"}
                    aria-describedby="emailnote"
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                  />
                  <p
                    id="emailnote"
                    className={
                      emailFocus && !validEmail ? "instructions" : "offscreen"
                    }
                  >
                    Email is invalid.
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="block mb-1">
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
                    value={pwd}
                    maxLength={24}
                    required
                    aria-invalid={validPwd ? "false" : "true"}
                    aria-describedby="pwdnote"
                  />
                  <p id="pwdnote" className="mt-1 text-xs text-white/80">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-1" /> 8
                    to 24 chars with upper/lowercase, number, and !@#$%.
                  </p>
                </div>

                <div>
                  <label htmlFor="matchpassword" className="block mb-1">
                    Confirm Password:
                    <span className={validMatch && matchPwd ? "valid" : "hide"}>
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                    <span
                      className={validMatch || !matchPwd ? "hide" : "invalid"}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </span>
                  </label>
                  <input
                    type="password"
                    id="matchpassword"
                    name="matchpassword"
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => setMatchPwd(e.target.value)}
                    value={matchPwd}
                    maxLength={24}
                    required
                    aria-invalid={validMatch ? "false" : "true"}
                    aria-describedby="matchnote"
                  />
                  <p
                    id="matchnote"
                    className={
                      !validMatch && matchPwd ? "instructions" : "offscreen"
                    }
                  >
                    Passwords do not match.
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="country" className="block mb-1">
                    Country:
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                    onChange={(e) => setCountry(e.target.value)}
                    value={country}
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block mb-1">Register for tournament:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {divisionLoading && (
                      <div className="text-sm text-gray-500">
                        Loading divisions...
                      </div>
                    )}
                    {!divisionLoading && divisions.length === 0 && (
                      <div className="text-sm text-gray-500">
                        No divisions available.
                      </div>
                    )}
                    {registrationDivisionOptions.map((option) => (
                      <label
                        key={option.key}
                        className="flex items-center gap-2 rounded border border-white/60 px-3 py-2 text-sm text-white"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={option.divisionIds.every((id) =>
                            selectedDivisionIds.includes(id),
                          )}
                          onChange={() => toggleDivisionGroup(option.divisionIds)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              {step === 1 ? (
                <button
                  type="submit"
                  disabled={
                    !validName ||
                    !validEmail ||
                    !validPwd ||
                    !validMatch ||
                    prefillLoading
                  }
                  className="bg-lighter text-white p-2 rounded-lg w-full mt-2 disabled:opacity-50"
                >
                  {prefillLoading ? "Validating email..." : "Continue"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleBackToStepOne}
                    className="border border-white/60 text-white p-2 rounded-lg w-1/3 mt-2"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-lighter text-white p-2 rounded-lg w-2/3 mt-2"
                  >
                    Submit account
                  </button>
                </>
              )}
            </div>
          </form>

          <div className="w-full max-w-sm mx-auto rounded-xl border border-white/20 bg-black/20 p-4 text-center">
            <p className="text-sm opacity-80">Already registered?</p>
            <Link
              to="/login"
              className="mt-2 inline-flex w-full items-center justify-center rounded border border-white/60 px-3 py-1 text-xs text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
