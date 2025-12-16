import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET_WORD;
if (!secret) {
    throw new Error("JWT_SECRET must be defined in environment variables");
}

interface AuthRequest extends Request {
    userID?: string;
}

interface JwtPayload {
    userID: string;
}

export const verify = (req: AuthRequest, res: Response, next: NextFunction) : void=> {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
    }

    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.userID = decoded.userID;
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid token" });
        return;
    }
};
