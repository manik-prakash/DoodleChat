import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import prisma from "@repo/db/client";
import 'dotenv/config';

const secret = process.env.JWT_SECRET_WORD;
if (!secret) {
  throw new Error("JWT_SECRET_WORD must be defined in environment variables");
}
// console.log(secret);
// console.log(process.env.DATABASE_URL);
const wss = new WebSocketServer({ port: 8080 });
//console.log(`WebSocket server running on port 8080`);

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

  const messageQueue: string[] = [];
  let userReady = false;
  let user: User | null = null;

  ws.on('message', async function message(data) {
    const dataStr = data.toString();

    if (!userReady || !user) {
      //console.log('[WS] Queuing message until user is ready');
      messageQueue.push(dataStr);
      return;
    }

    await processMessage(ws, user, dataStr);
  });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { id: true, username: true }
    });

    if (!dbUser) {
      sendError(ws, "User not found");
      ws.close();
      return;
    }

    user = {
      ws,
      rooms: [],
      userId: dbUser.id,
      username: dbUser.username
    };
    users.push(user);
    userReady = true;

    //console.log(`User ${dbUser.username} connected`);
    for (const queuedData of messageQueue) {
      console.log(`[WS] Processing queued message for ${user.username}`);
      await processMessage(ws, user, queuedData);
    }
    messageQueue.length = 0;
  } catch (err) {
    //console.error('[WS] Error during user setup:', err);
    sendError(ws, "Connection setup failed");
    ws.close();
    return;
  }

  ws.on('close', () => {
    if (user) {
      user.rooms.forEach(roomId => {
        broadcast(roomId, {
          type: "user_left",
          userId: user!.userId,
          username: user!.username,
          roomId
        });
      });

      const index = users.indexOf(user);
      if (index > -1) {
        users.splice(index, 1);
      }

      //console.log(`User ${user.username} disconnected`);
    }
  });

  ws.on('error', (err) => {
    if (user) {
      console.error(`WebSocket error for user ${user.username}:`, err);
    }
  });
});

async function processMessage(ws: WebSocket, user: User, dataStr: string) {
  try {
    const parsedData = JSON.parse(dataStr) as WSMessage;
    //console.log(`[WS] Received message from ${user.username}:`, parsedData.type, parsedData);

    switch (parsedData.type) {
      case "join_room": {
        const { roomId } = parsedData;
        //console.log(`[join_room] User ${user.username} attempting to join room: ${roomId}`);

        try {
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          //console.log(`[join_room] Room lookup result:`, room ? `Found: ${room.slug}` : 'Not found');

          if (!room) {
            //console.log(`[join_room] Room not found, sending error`);
            sendError(ws, "Room not found");
            return;
          }

          if (!user.rooms.includes(roomId)) {
            user.rooms.push(roomId);
            //console.log(`[join_room] Added room to user's rooms:`, user.rooms);
          }

          broadcast(roomId, {
            type: "user_joined",
            userId: user.userId,
            username: user.username,
            roomId
          }, ws);

          //console.log(`[join_room] Sending room_joined confirmation`);
          ws.send(JSON.stringify({
            type: "room_joined",
            roomId,
            slug: room.slug,
            ownerId: room.ownerId,
            message: `Joined room: ${room.slug}`
          }));

          //console.log(`[join_room] User ${user.username} successfully joined room ${room.slug}`);
        } catch (dbError) {
          console.error(`[join_room] Database error:`, dbError);
          sendError(ws, "Failed to join room");
        }
        break;
      }

      case "leave_room": {
        const { roomId } = parsedData;
        user.rooms = user.rooms.filter(r => r !== roomId);

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
        const chat = await prisma.chat.create({
          data: {
            message: chatMessage.trim(),
            userId: user.userId,
            roomId
          }
        });

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
        const savedShape = await prisma.shape.create({
          data: {
            data: shape,
            userId: user.userId,
            roomId
          }
        });

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

        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room || room.ownerId !== user.userId) {
          sendError(ws, "Only room owner can clear the canvas");
          return;
        }

        await prisma.shape.deleteMany({ where: { roomId } });

        broadcast(roomId, {
          type: "canvas_cleared",
          roomId,
          clearedBy: user.username
        });

        //console.log(`Canvas cleared in room ${room.slug} by ${user.username}`);
        break;
      }

      default:
        sendError(ws, "Unknown message type");
    }
  } catch (err) {
    console.error("Error processing message:", err);
    sendError(ws, "Failed to process message");
  }
}
