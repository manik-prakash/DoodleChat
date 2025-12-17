import { Request, Response, NextFunction } from "express";
import prisma  from "@repo/db/client";

interface AuthRequest extends Request {
    userID?: string;
}

export const getRoomShapes = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const { roomId } = req.params;

        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const shapes = await prisma.shape.findMany({
            where: { roomId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                data: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        return res.json({ shapes });
    } catch (err) {
        next(err);
    }
};

export const deleteShape = async (
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

        const shape = await prisma.shape.findUnique({
            where: { id },
            include: { room: true },
        });

        if (!shape) {
            return res.status(404).json({ message: "Shape not found" });
        }

        // Only shape creator or room owner can delete
        if (shape.userId !== userId && shape.room.ownerId !== userId) {
            return res.status(403).json({ message: "Not authorized to delete this shape" });
        }

        await prisma.shape.delete({ where: { id } });

        return res.json({ message: "Shape deleted successfully" });
    } catch (err) {
        next(err);
    }
};

export const clearRoomShapes = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const { roomId } = req.params;
        const userId = req.userID;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.ownerId !== userId) {
            return res.status(403).json({ message: "Only room owner can clear all shapes" });
        }

        await prisma.shape.deleteMany({ where: { roomId } });

        return res.json({ message: "All shapes cleared successfully" });
    } catch (err) {
        next(err);
    }
};
