import { Router, type Router as RouterType } from "express";
import { createRoom, getRoomBySlug, getUserRooms, deleteRoom } from "../controllers/roomController";
import { verify } from "../middlewares/auth";

const router: RouterType = Router();

// Protected routes
router.post("/", verify, createRoom);
router.get("/", verify, getUserRooms);
router.delete("/:id", verify, deleteRoom);

// Public routes
router.get("/:slug", getRoomBySlug);

export default router;
