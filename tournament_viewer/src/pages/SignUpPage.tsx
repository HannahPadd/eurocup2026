import RegisterForm from "../components/RegisterComponent";



export default function SignUpPage() {
    return (
        <div>
            <div className="w-full max-w-sm mx-auto space-y-4">
                <h1 className="text-3xl  mb-2 mt-4">Sign up!</h1>
            </div>
            <div>
                <RegisterForm/>
            </div>
        </div>
    )
}