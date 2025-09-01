import { Server, Socket } from "socket.io";
import { dm } from "../Schemas/Dm.js";
import User from "../Schemas/User.js";
import userIdToSocketIdMap from "./userIdToSocketMap.js";

/**
 * @description Initializes The Open Dm CallBack For The Server
 * @param {Socket} ws;
 * @param {Server} server
 * @returns {void}
*/
export default function initOpenDmCb(ws, server){
    ws.on('openDm', async other => {
        if(!ws.data){
            ws.emit('err', {msg: "authenticate first"});
            ws.disconnect();
            return;
        }

        const socketUser = ws.data;
        const otherUser = other;

        const dbSocketUser = await User.findOne().where('userName').equals(socketUser.userName).populate({path: 'openedDms',
            populate: [{path: 'first'}, {path: 'second'}]
        });
        
        const dbOtherUser = await User.findOne().where('userName').equals(otherUser.userName);

        if(dbSocketUser.openedDms.some(e => e.first.userName == dbSocketUser.userName ? e.second.userName ==
            otherUser.userName : e.first.userName == otherUser.userName)) {

            const newDm = dbSocketUser.openedDms.find(e => e.first.userName == dbSocketUser.userName ? e.second.userName ==
                otherUser.userName : e.first.userName == otherUser.userName);
            ws.emit('dmOpenedByYou', {user: otherUser, dmUUID: newDm.uuid});
            return;
        };

        const newDm = await dm.create({first: dbSocketUser._id, second: dbOtherUser._id, messages: []});
        
        dbSocketUser.openedDms = [newDm._id, ...dbSocketUser.openedDms];
        dbOtherUser.openedDms = [newDm._id, ...dbOtherUser.openedDms];

        await dbSocketUser.save();
        await dbOtherUser.save();

        delete dbSocketUser.passWord;

        ws.emit('dmOpenedByYou', {user: otherUser, dmUUID: newDm.uuid});
        server.to(userIdToSocketIdMap.get(dbOtherUser._id.toString())).emit('dmOpened', {user: dbSocketUser, dmUUID: newDm.uuid});
    });
}