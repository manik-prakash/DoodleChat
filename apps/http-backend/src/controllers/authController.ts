import { Request, Response, NextFunction } from "express";
import prisma  from "@repo/db/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { signinSchema, signupSchema } from "@repo/common/types";

const secret = process.env.JWT_SECRET_WORD;
if (!secret) {
    throw new Error("JWT_SECRET must be defined in environment variables");
}

interface SigninBody {
    email: string;
    password: string;
}

interface SignupBody {
    username: string;
    email: string;
    password: string;
}

export const signin = async (
    req: Request<{}, {}, SigninBody>,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const parsedData = signinSchema.safeParse(req.body);
        if (!parsedData.success) {
            console.log(parsedData.error);
            res.json({
                message: "Incorrect inputs"
            })
            return;
        }

        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { userID: user.id, email: user.email, username: user.username },
            secret,
            { expiresIn: "4h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
        });
    } catch (err) {
        next(err);
    }
};

export const signup = async (
    req: Request<{}, {}, SignupBody>,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const parsedData = signupSchema.safeParse(req.body);
        if (!parsedData.success) {
            console.log(parsedData.error);
            res.json({
                message: "Incorrect inputs"
            })
            return;
        }

        const { username, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ message: "Email already in use." });
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash: hash,
            },
        });

        const token = jwt.sign(
            { userID: newUser.id, email: newUser.email, username: newUser.username },
            secret,
            { expiresIn: "4h" }
        );

        return res.status(201).json({
            message: "User created successfully",
            token,
        });
    } catch (err) {
        next(err);
    }
};