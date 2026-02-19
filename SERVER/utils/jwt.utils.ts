import jwt from "jsonwebtoken";
import dotenv from "dotenv"; 

//fonction pour la creation des tokens JWT

export const handleAccessToken = (id: string, username: string, role: string, ACCESS_TOKEN_SECRET: string) => {
    const accessToken = jwt.sign(
            { "id": id, "role": role, "username": username },
            ACCESS_TOKEN_SECRET,
            { expiresIn: '15min' }
        );
    return accessToken;
}


export const handleRefreshToken = ( id: string, username: string, role: string, REFRESH_TOKEN_SECRET: string) => {
    const refreshToken = jwt.sign(
            { "id": id, "role": role, "username": username },
            REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );
    return refreshToken;
}
