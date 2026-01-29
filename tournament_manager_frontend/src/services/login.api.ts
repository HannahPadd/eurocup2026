import axios from "axios";
import { createLoginRequest } from "../models/requests/login-requests";

export async function login(request: createLoginRequest, LOGIN_URL: string) {
    try {
        const response = await axios.post(LOGIN_URL,
            JSON.stringify({username: request.username, password: request.password}),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                });

        return response;

    } catch (error) {
        console.error("Error logging player in:", error);
        throw new Error("Unable to log in.");
    }
}