import { Request, Response, NextFunction } from "express";
import  prisma  from "@repo/db/client";
import { z } from "zod";

const createChatSchema = z.object({
    roomId: z.string().uuid(),
    message: z.string().min(1).max(1000).trim(),
});

interface AuthRequest extends Request {
    userID?: string;
}

export const getRoomChats = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const { roomId } = req.params;
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;

        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const chats = await prisma.chat.findMany({
            where: { roomId },
            orderBy: { createdAt: "asc" },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        return res.json({ chats });
    } catch (err) {
        next(err);
    }
};

export const createChat = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const parsedData = createChatSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: parsedData.error.flatten(),
            });
        }

        const userId = req.userID;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const room = await prisma.room.findUnique({
            where: { id: parsedData.data.roomId },
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const chat = await prisma.chat.create({
            data: {
                message: parsedData.data.message,
                userId,
                roomId: parsedData.data.roomId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        return res.status(201).json({ chat });
    } catch (err) {
        next(err);
    }
};
