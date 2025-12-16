import { WebSocketServer , WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
const secret = process.env.JWT_SECRET_WORD;
if (!secret) {
  throw new Error("JWT_SECRET must be defined in environment variables");
}
const wss = new WebSocketServer({ port: 8080 });
console.log(`running on port 8080`);
interface User{
  ws : WebSocket,
  rooms : string[],
  userId : string
}

const users : User[] = [];

function checkUser(token: string): string | null {

  const decoded = jwt.verify(token, secret as string);
  if (typeof decoded == "string") {
    return null;
  }

  if (!decoded || !decoded.userID) {
    return null;
  }

  return decoded.userID;
}

wss.on('connection', function connection(ws, request) {

  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') ?? "";

  const authenticatedUserId = checkUser(token);
  if (!authenticatedUserId) {
    ws.close();
    return null;
  }

  users.push({
    ws,
    rooms: [],
    userId: authenticatedUserId
  })

  ws.on('message', async function message(data) {
  
    const parsedData = JSON.parse(data as unknown as string);

    if(parsedData.type === "join_room"){
      const user = users.find(x =>x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if(parsedData.type === "leave_room"){
      const user = users.find(x =>x.ws === ws);
      if(!user){
        return null;
      }
      user.rooms = user?.rooms.filter(x => x === parsedData.roomId);
    }
    
    if(parsedData.type === 'chat'){
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      const res = await prisma.chat.create({
        data:{
          message : message,
          userId : authenticatedUserId,
          roomId : roomId
        }
      });

      users.forEach(user => {
        if(user.rooms.includes(roomId)){
          user.ws.send(JSON.stringify({
            type : "chat",
            message : message,
            roomId
          }))
        }
      })
    }

  });

}); 