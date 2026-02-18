import axios from "axios";
import { CreateUserRequest } from "../models/requests/user-requests";

export interface RegistrationPrefill {
  ticketCode: string | null;
  gamerTag: string | null;
  country: string | null;
  attendingAs: string | null;
  registrationDate: string | null;
  preferredDivisions: string[];
}

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

export async function getRegistrationPrefill(gamerTag: string): Promise<RegistrationPrefill> {
  try {
    const response = await axios.get<RegistrationPrefill>("user/registration-prefill", {
      params: { gamerTag },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        typeof error.response?.data?.message === "string"
          ? error.response?.data?.message
          : "Unable to validate preregistration gamer tag.";
      throw new Error(message);
    }
    throw new Error("Unable to validate preregistration gamer tag.");
  }
}
