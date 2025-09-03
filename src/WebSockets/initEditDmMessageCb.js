import { dm } from "../Schemas/Dm.js";
import User from "../Schemas/User.js";
import userIdToSocketIdMap from "./userIdToSocketMap.js";
import {dmMessage} from "../Schemas/DmMessage.js"
import mongoose from "mongoose";

export default function initEditDmMessageCb(ws, server){
    ws.on('editDmMessage', async data => {
        const socketUser = ws.data;
        const otherUser = data.user;
        const msgUUID = data.msg.uuid;
        const msgNewContent = data.msg.content;
        const openDm = data.dm;

        const msg = await dmMessage.findOne().where('uuid').equals(msgUUID);
        msg.content = msgNewContent;
        await msg.save();

        ws.emit('dmMessageEdited', {senderUser: socketUser.userName,
            dm: {_id: openDm._id}, content: msgNewContent, uuid: msgUUID
        });
        server.to(userIdToSocketIdMap.get(otherUser._id.toString())).emit('dmMessageEdited', {senderUser: socketUser.userName,
            dm: {_id: openDm._id}, content: msgNewContent, uuid: msgUUID
        });
    });

}