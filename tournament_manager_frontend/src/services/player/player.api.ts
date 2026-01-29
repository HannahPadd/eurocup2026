import axios from "axios";
import { Player } from "../../models/Player";
import { createPlayerRequest } from "../../models/requests/player-requests";

export async function createPlayer(request: createPlayerRequest): Promise<Player> {
    try {
        const response = await axios.post<Player>("players/", request);
        return response.data;
    } catch (error) {
        console.error("Error creating player:", error);
        throw new Error("Unable to create player.");
    }
}



export async function getPlayer(playerId: number) {
    try {
        const response = await axios.get<Player>("players/" + playerId);
        return response.data;
    } catch (error) {
        console.error("Error listing player:", error);
        throw new Error("Unable to list player.");
    }
}

export async function updatePlayer(playerId: number) {
    return playerId;
}

export async function deletePlayer(playerId: number) {
    try {
        await axios.delete("players/" + playerId);
    } catch (error) {
        console.error("Error deleting player:", error);
        throw new Error("Unable to delete player.");
    }
}