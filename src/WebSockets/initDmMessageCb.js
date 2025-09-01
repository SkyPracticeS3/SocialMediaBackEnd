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

        const dbSocketUser = await User.findOne().where('userName').equals(socketUser.userName);
        const dbOtherUser = await User.findOne().where('userName').equals(otherUser.userName);

        const dbOpenDm = await dm.findOne().where('uuid').equals(openDm._id);

        const DmMessage = await dmMessage.create({senderUser: dbSocketUser._id,
            receiverUser: dbOtherUser._id, content: text});
        dbOpenDm.messages.push(DmMessage._id);

        await dbOpenDm.save();

        
        server.to(userIdToSocketIdMap.get(dbOtherUser._id.toString())).emit('dmMessageSent', {senderUser: dbSocketUser.userName,
            dm: dbOpenDm, content: text
        });
    });

}