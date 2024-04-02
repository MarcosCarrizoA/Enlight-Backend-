import dotenv from "dotenv";
import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

dotenv.config();

export interface Token extends JwtPayload {
    id: number;
}

function authenticate(req: Request, res: Response, next: Function) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(400).send();
        return;
    }
    const token: string | undefined = authHeader.split("Bearer ")[1];
    if (!token) {
        res.status(400).send();
        return;
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_KEY!, (error, decoded) => {
        if (error) {
            console.error(error);
            res.status(401).send();
            return;
        }
        req.body.id = (decoded as Token).id;
        next();
    });
}

function refresh(req: Request, res: Response, next: Function) {
    const authHeader = req.headers.authorization;
    if (authHeader == undefined) {
        res.status(400).send();
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    if (token == undefined) {
        res.status(400).send();
        return;
    }
    jwt.verify(token, process.env.REFRESH_TOKEN_KEY!, (error, decoded) => {
        if (error) {
            console.error(error);
            res.status(401).send();
            return;
        }
        req.body.token = token;
        req.body.id = (decoded as Token).id;
        next();
    });
}

export default { authenticate, refresh };