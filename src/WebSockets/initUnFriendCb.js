import User from "../Schemas/User.js";
import userIdToSocketIdMap from "./userIdToSocketMap.js";

export default function initUnFriendCb(ws, server) {
    ws.on('unFriend', async data => {
        if(!ws.data){
            ws.emit('err', {msg: 'authenticate first'});
            ws.disconnect();
            return;
        }
        const socketUser = ws.data;
        const otherUser = data;

        const dbSocketUser = await User.findOne().where('userName').equals(socketUser.userName).populate({path: 'relations', populate:
             [{path: 'first'}, {path: 'second'}]});
        const dbOtherUser = await User.findOne().where('userName').equals(otherUser.userName).populate('relations');

        dbSocketUser.relations = dbSocketUser.relations.filter(e => 
            e.first._id.equals(dbSocketUser._id) ? !e.second._id.equals(dbOtherUser._id) : 
                !e.first._id.equals(dbOtherUser._id)
        );
        dbOtherUser.relations = dbOtherUser.relations.filter(e => 
            e.first._id.equals(dbOtherUser._id) ? !e.second._id.equals(dbSocketUser._id) : 
                !e.first._id.equals(dbSocketUser._id)
        );

        await dbOtherUser.save();
        await dbSocketUser.save();

        const sentUnFriender = structuredClone(dbSocketUser.toObject());
        delete sentUnFriender.passWord;

        server.to(userIdToSocketIdMap.get(dbOtherUser._id.toString())).emit('unFriended', {unFriender: sentUnFriender});
    })
}