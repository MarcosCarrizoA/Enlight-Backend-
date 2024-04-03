import jwt, { type JwtPayload } from "jsonwebtoken";

export interface TokenResponse extends JwtPayload {
    id?: number;
    error?: string;
}

async function signAccessToken(id: number): Promise<string | undefined> {
    return new Promise((resolve) => {
        jwt.sign({ id: id }, Bun.env.ACCESS_TOKEN_KEY!, { expiresIn: 900 }, (error, token) => {
            if (error) {
                resolve(undefined);
            }
            resolve(token);
        });
    });
}

async function decodeAccessToken(token: string): Promise<number | undefined> {
    return new Promise((resolve) => {
        jwt.verify(token, Bun.env.ACCESS_TOKEN_KEY!, {}, (error, decoded) => {
            if (error) {
                resolve(undefined);
            }
            resolve((decoded as TokenResponse).id);
        });
    });
}

async function signRefreshToken(id: number): Promise<string | undefined> {
    return new Promise((resolve) => {
        jwt.sign({ id: id }, Bun.env.REFRESH_TOKEN_KEY!, {}, (error, token) => {
            if (error) {
                resolve(undefined);
            }
            resolve(token);
        });
    });
}

async function decodeRefreshToken(token: string): Promise<number | undefined> {
    return new Promise((resolve) => {
        jwt.verify(token, Bun.env.REFRESH_TOKEN_KEY!, {}, (error, decoded) => {
            if (error) {
                resolve(undefined);
            }
            resolve((decoded as TokenResponse).id);
        });
    });
}

async function signPasswordToken(id: number): Promise<string | undefined> {
    return new Promise((resolve) => {
        jwt.sign({ id: id }, Bun.env.PASSWORD_TOKEN_KEY!, { expiresIn: 900 }, (error, token) => {
            if (error) {
                resolve(undefined);
            }
            resolve(token);
        });
    });
}

async function decodePasswordToken(token: string): Promise<TokenResponse> {
    return new Promise((resolve) => {
        jwt.verify(token, Bun.env.PASSWORD_TOKEN_KEY!, {}, (error, decoded) => {
            if (error) {
                resolve({ error: error.name });
            }
            resolve(decoded as TokenResponse);
        });
    });
}

export default { signAccessToken, decodeAccessToken, signRefreshToken, decodeRefreshToken, signPasswordToken, decodePasswordToken };