import { Request, Response, NextFunction } from "express";
import  prisma  from "@repo/db/client";
import { z } from "zod";

const createRoomSchema = z.object({
    name: z.string().min(1).max(50).trim(),
});

interface AuthRequest extends Request {
    userID?: string;
}

export const createRoom = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const parsedData = createRoomSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid room name",
                errors: parsedData.error.flatten(),
            });
        }

        const userId = req.userID;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const existingRoom = await prisma.room.findUnique({
            where: { slug: parsedData.data.name },
        });

        if (existingRoom) {
            return res.status(409).json({
                message: "Room already exists with this name",
            });
        }

        const room = await prisma.room.create({
            data: {
                slug: parsedData.data.name,
                ownerId: userId,
            },
        });

        return res.status(201).json({
            message: "Room created successfully",
            room: {
                id: room.id,
                slug: room.slug,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const getRoomBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const { slug } = req.params;

        const room = await prisma.room.findUnique({
            where: { slug },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        return res.json({ room });
    } catch (err) {
        next(err);
    }
};

export const getUserRooms = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const userId = req.userID;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const rooms = await prisma.room.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                slug: true,
                createdAt: true,
            },
        });

        return res.json({ rooms });
    } catch (err) {
        next(err);
    }
};

export const deleteRoom = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const { id } = req.params;
        const userId = req.userID;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const room = await prisma.room.findUnique({
            where: { id },
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.ownerId !== userId) {
            return res.status(403).json({ message: "Not authorized to delete this room" });
        }

        // Delete related shapes and chats first
        await prisma.shape.deleteMany({ where: { roomId: id } });
        await prisma.chat.deleteMany({ where: { roomId: id } });
        await prisma.room.delete({ where: { id } });

        return res.json({ message: "Room deleted successfully" });
    } catch (err) {
        next(err);
    }
};
