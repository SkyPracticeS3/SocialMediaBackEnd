import User from '../Schemas/User.js';
import { friendRequest } from '../Schemas/FriendRequest.js';
import userIdToSocketIdMap from './userIdToSocketMap.js';

export default function initFriendReqSendCb(ws, server){ 
    ws.on('sendFriendRequest', async data => {
        if(ws.data == null){
            ws.emit('error', {msg: 'Authenticate First'});
            ws.disconnect();
            return;
        }
        const targetUser = await User.findOne().where('userName').equals(data.userName)
            .populate('pendingReceivedFriendRequests').populate('relations').exec();
        /** @type {User}*/
        const senderUser = ws.data;

        if(targetUser.pendingReceivedFriendRequests.some(e => e.senderUser._id == senderUser._id) ||
            senderUser.pendingReceivedFriendRequests.some(e => e.senderUser._id == targetUser._id)){
            ws.emit('error', {msg: 'There\'s An Already Pending Friend Request'});
            return;
        }

        const friendReq = await friendRequest.create({senderUser: senderUser._id,
            receiverUser: targetUser._id});

        targetUser.pendingReceivedFriendRequests.push(friendReq._id);
        senderUser.pendingSentFriendRequests.push(friendReq._id);

        await targetUser.save();
        await senderUser.save();
        ws.emit('friendRequestSent', {msg: 'Friend Request Successfully Got Sent To ' + targetUser.userName,
            targetUser: targetUser});
             userIdToSocketIdMap.get(targetUser._id)
        let sentSenderUser = structuredClone(senderUser.toObject());
        delete sentSenderUser.passWord;
        delete sentSenderUser._id;
        server.to(userIdToSocketIdMap.get(targetUser._id)).emit('friendRequestReceived', {sender: sentSenderUser});
    });
}   