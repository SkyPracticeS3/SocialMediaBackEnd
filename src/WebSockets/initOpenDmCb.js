import { dm } from "../Schemas/Dm.js";
import User from "../Schemas/User.js";
import userIdToSocketIdMap from "./userIdToSocketMap.js";

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
            return;
        };

        const newDm = await dm.create({first: dbSocketUser._id, second: dbOtherUser._id, messages: []});
        
        dbSocketUser.openedDms.push(newDm._id);
        dbOtherUser.openedDms.push(newDm._id);

        await dbSocketUser.save();
        await dbOtherUser.save();

        delete dbSocketUser.passWord;

        server.to(userIdToSocketIdMap.get(dbOtherUser._id.toString())).emit('dmOpened', {user: dbSocketUser});
    });
}