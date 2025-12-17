import { Router, type Router as RouterType } from "express";
import { getRoomChats, createChat } from "../controllers/chatController";
import { verify } from "../middlewares/auth";

const router: RouterType = Router();

// Get chats for a room (public - allows viewing room chats)
router.get("/:roomId", getRoomChats);

// Create a chat message (protected)
router.post("/", verify, createChat);

export default router;
