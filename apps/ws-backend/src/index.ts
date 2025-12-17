import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import prisma from "@repo/db/client";
import 'dotenv/config';

const secret = process.env.JWT_SECRET_WORD;
if (!secret) {
  throw new Error("JWT_SECRET_WORD must be defined in environment variables");
}
console.log(process.env.DATABASE_URL);
const wss = new WebSocketServer({ port: 8080 });
console.log(`WebSocket server running on port 8080`);

// Type definitions for messages
interface JoinRoomMessage {
  type: "join_room";
  roomId: string;
}

interface LeaveRoomMessage {
  type: "leave_room";
  roomId: string;
}

interface ChatMessage {
  type: "chat";
  roomId: string;
  message: string;
}

interface DrawMessage {
  type: "draw";
  roomId: string;
  shape: {
    type: "rect" | "circle" | "pencil";
    [key: string]: any;
  };
}

interface ClearCanvasMessage {
  type: "clear_canvas";
  roomId: string;
}

type WSMessage = JoinRoomMessage | LeaveRoomMessage | ChatMessage | DrawMessage | ClearCanvasMessage;

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
  username: string;
}

const users: User[] = [];

function checkUser(token: string): { userId: string; username?: string } | null {
  try {
    const decoded = jwt.verify(token, secret as string) as { userID: string; email?: string };

    if (!decoded || !decoded.userID) {
      return null;
    }

    return { userId: decoded.userID };
  } catch (err) {
    return null;
  }
}

function broadcast(roomId: string, message: object, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  users.forEach(user => {
    if (user.rooms.includes(roomId) && user.ws !== excludeWs && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(payload);
    }
  });
}

function sendError(ws: WebSocket, error: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "error", message: error }));
  }
}

wss.on('connection', async function connection(ws, request) {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') ?? "";

  const authResult = checkUser(token);
  if (!authResult) {
    sendError(ws, "Authentication failed");
    ws.close();
    return;
  }

  // Fetch user info from database
  const dbUser = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { id: true, username: true }
  });

  if (!dbUser) {
    sendError(ws, "User not found");
    ws.close();
    return;
  }

  const user: User = {
    ws,
    rooms: [],
    userId: dbUser.id,
    username: dbUser.username
  };
  users.push(user);

  console.log(`User ${dbUser.username} connected`);

  ws.on('message', async function message(data) {
    try {
      const parsedData = JSON.parse(data.toString()) as WSMessage;

      switch (parsedData.type) {
        case "join_room": {
          const { roomId } = parsedData;

          // Verify room exists
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          if (!room) {
            sendError(ws, "Room not found");
            return;
          }

          if (!user.rooms.includes(roomId)) {
            user.rooms.push(roomId);
          }

          // Notify others in room
          broadcast(roomId, {
            type: "user_joined",
            userId: user.userId,
            username: user.username,
            roomId
          }, ws);

          // Send confirmation to the user
          ws.send(JSON.stringify({
            type: "room_joined",
            roomId,
            message: `Joined room: ${room.slug}`
          }));

          console.log(`User ${user.username} joined room ${room.slug}`);
          break;
        }

        case "leave_room": {
          const { roomId } = parsedData;
          user.rooms = user.rooms.filter(r => r !== roomId);

          // Notify others in room
          broadcast(roomId, {
            type: "user_left",
            userId: user.userId,
            username: user.username,
            roomId
          });

          console.log(`User ${user.username} left room ${roomId}`);
          break;
        }

        case "chat": {
          const { roomId, message: chatMessage } = parsedData;

          if (!user.rooms.includes(roomId)) {
            sendError(ws, "You must join the room first");
            return;
          }

          if (!chatMessage || chatMessage.trim().length === 0) {
            sendError(ws, "Message cannot be empty");
            return;
          }

          // Save to database
          const chat = await prisma.chat.create({
            data: {
              message: chatMessage.trim(),
              userId: user.userId,
              roomId
            }
          });

          // Broadcast to all users in room including sender
          broadcast(roomId, {
            type: "chat",
            id: chat.id,
            message: chatMessage.trim(),
            userId: user.userId,
            username: user.username,
            roomId,
            createdAt: chat.createdAt
          });

          break;
        }

        case "draw": {
          const { roomId, shape } = parsedData;

          if (!user.rooms.includes(roomId)) {
            sendError(ws, "You must join the room first");
            return;
          }

          if (!shape || !shape.type) {
            sendError(ws, "Invalid shape data");
            return;
          }

          // Save shape to database
          const savedShape = await prisma.shape.create({
            data: {
              data: shape,
              userId: user.userId,
              roomId
            }
          });

          // Broadcast to all users in room including sender
          broadcast(roomId, {
            type: "draw",
            id: savedShape.id,
            shape,
            userId: user.userId,
            username: user.username,
            roomId,
            createdAt: savedShape.createdAt
          });

          break;
        }

        case "clear_canvas": {
          const { roomId } = parsedData;

          if (!user.rooms.includes(roomId)) {
            sendError(ws, "You must join the room first");
            return;
          }

          // Check if user is room owner
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          if (!room || room.ownerId !== user.userId) {
            sendError(ws, "Only room owner can clear the canvas");
            return;
          }

          // Delete all shapes in room
          await prisma.shape.deleteMany({ where: { roomId } });

          // Broadcast clear event
          broadcast(roomId, {
            type: "canvas_cleared",
            roomId,
            clearedBy: user.username
          });

          console.log(`Canvas cleared in room ${room.slug} by ${user.username}`);
          break;
        }

        default:
          sendError(ws, "Unknown message type");
      }
    } catch (err) {
      console.error("Error processing message:", err);
      sendError(ws, "Failed to process message");
    }
  });

  ws.on('close', () => {
    // Notify all rooms the user was in
    user.rooms.forEach(roomId => {
      broadcast(roomId, {
        type: "user_left",
        userId: user.userId,
        username: user.username,
        roomId
      });
    });

    // Remove user from list
    const index = users.indexOf(user);
    if (index > -1) {
      users.splice(index, 1);
    }

    console.log(`User ${user.username} disconnected`);
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for user ${user.username}:`, err);
  });
});