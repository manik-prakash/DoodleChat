import 'dotenv/config';
import express, { Request, Response, NextFunction } from "express";
import cors from 'cors';
import authRoute from './routes/authRoute';
import roomRoute from './routes/roomRoute';
import chatRoute from './routes/chatRoute';
import shapeRoute from './routes/shapeRoute';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3002"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.get("/ping", (req, res) => {
    res.send("pong, working.");
});

app.use("/auth", authRoute);
app.use("/room", roomRoute);
app.use("/chat", chatRoute);
app.use("/shape", shapeRoute);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`HTTP Backend running on port ${PORT}`);
});