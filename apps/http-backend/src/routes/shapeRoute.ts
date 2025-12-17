import { Router, type Router as RouterType } from "express";
import { getRoomShapes, deleteShape, clearRoomShapes } from "../controllers/shapeController";
import { verify } from "../middlewares/auth";

const router: RouterType = Router();

// Get shapes for a room (public - allows viewing canvas)
router.get("/:roomId", getRoomShapes);

// Delete a single shape (protected)
router.delete("/:id", verify, deleteShape);

// Clear all shapes in a room (protected - owner only)
router.delete("/room/:roomId/clear", verify, clearRoomShapes);

export default router;
