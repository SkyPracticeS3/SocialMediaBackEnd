import { dm } from "../Schemas/Dm.js";
import User from "../Schemas/User.js";
import userIdToSocketIdMap from "./userIdToSocketMap.js";
import {dmMessage} from "../Schemas/DmMessage.js"
import mongoose from "mongoose";

export default function initDmMessageCb(ws, server){
    ws.on('sendDmMessage', async data => {
        const socketUser = ws.data;
        const otherUser = data.user;
        const text = data.content;
        const openDm = data.dm;

        const DmMessage = await dmMessage.create({senderUser: socketUser._id,
            receiverUser: otherUser._id, content: text});

        ws.emit('dmMessageSent', {senderUser: socketUser.userName,
            dm: {_id: openDm._id}, content: text, uuid: DmMessage.uuid
        });
        server.to(userIdToSocketIdMap.get(otherUser._id.toString())).emit('dmMessageSent', {senderUser: socketUser.userName,
            dm: {_id: openDm._id}, content: text, uuid: DmMessage.uuid
        });
    });

}