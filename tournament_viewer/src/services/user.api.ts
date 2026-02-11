import axios from "axios";
import { CreateUserRequest } from "../models/requests/user-requests";

export async function createUser(request: CreateUserRequest) {
  try {
    const response = await axios.post("user", request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        typeof error.response?.data?.message === "string"
          ? error.response?.data?.message
          : "Unable to create user.";
      console.error("Error creating user:", message);
      throw new Error(message);
    }
    console.error("Error creating user:", error);
    throw new Error("Unable to create user.");
  }
}
