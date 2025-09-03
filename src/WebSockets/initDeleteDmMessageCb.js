import { dm } from "../Schemas/Dm.js";
import User from "../Schemas/User.js";
import userIdToSocketIdMap from "./userIdToSocketMap.js";
import {dmMessage} from "../Schemas/DmMessage.js"
import mongoose from "mongoose";

export default function initDeleteDmMessageCb(ws, server){
    ws.on('deleteDmMessage', async data => {
        const socketUser = ws.data;
        const otherUser = data.user;
        const msgUUID = data.msg.uuid;
        const openDm = data.dm;

        await dmMessage.deleteOne().where('uuid').equals(msgUUID);

        ws.emit('dmMessageDeleted', {senderUser: socketUser.userName,
            dm: {_id: openDm._id}, uuid: msgUUID
        });
        server.to(userIdToSocketIdMap.get(otherUser._id.toString())).emit('dmMessageDeleted', {senderUser: socketUser.userName,
            dm: {_id: openDm._id}, uuid: msgUUID
        });
    });

}