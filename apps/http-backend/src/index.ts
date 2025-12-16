import 'dotenv/config';
import express from "express";
import cors from 'cors';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin : ["http://localhost:3002"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))

app.get("/ping", (req, res) => {
    res.send("pong , working.");
})

app.use("/auth", authRoute);


app.listen(5000, () => {
    console.log("server running on port : 5000");
});
