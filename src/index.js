import express from "express";
import { fileURLToPath } from "url";
import dotenv from 'dotenv'
import { dirname } from 'path';
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userRouter from "./Routers/UserRouter.js";
import {groupChat} from './Schemas/GroupChat.js'
import { relation } from "./Schemas/Relation.js";
import { friendRequest } from "./Schemas/FriendRequest.js";
import {dmMessage} from './Schemas/DmMessage.js'
import {Server} from 'socket.io'
import http from 'http';
import initWsServer from "./WebSockets/initWsServer.js";
import cors from 'cors';

const dirName = dirname(fileURLToPath(import.meta.url));

dotenv.config();
const app = express();
const server = http.createServer(app)
const wsServer = new Server( server, {
    cors: {
        // This must match your Next.js frontend's origin
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
initWsServer(wsServer);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/users', userRouter);
app.get('/', (req, res) => {
    res.send('Welcome to the server! WebSocket server is running.');
});
server.listen(5000, ()=>{
    try{
        mongoose.connect(process.env.MONGODB_URI);
    } catch {
        console.log('failed mongodb connection');
    }
    console.log("listening on port http://localhost:5000");
});