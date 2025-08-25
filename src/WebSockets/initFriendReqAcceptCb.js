import bcrypt from 'bcrypt';
import User from '../Schemas/User.js';
import { relation } from '../Schemas/Relation.js';

export default function initFriendReqAcceptCb(ws, server) {
    ws.on('acceptFriendRequest', async data => {
        if(ws.data == null){
            ws.emit('error', {msg: 'Authenticate First'});
            ws.disconnect();
            return;
        }
        const sender = data;
        const senderModel = await User.findById(data._id).populate('pendingSentFriendRequests').exec();
        const receiver = ws.data;

        const sentReqIndex = senderModel.pendingSentFriendRequests.findIndex(e => receiver._id == e.receiverUser);

        if(sentReqIndex == -1){
            ws.emit('error', {msg: 'No Such Friend Request'});
            return;
        }

        const sentReq = senderModel.pendingSentFriendRequests[sentReqIndex];

        const receivedReqIndex = receiver.pendingReceivedFriendRequests.findIndex(e => e.senderUser == senderModel._id);
        const receivedReq = receiver.pendingReceivedFriendRequests[receivedReqIndex];

        receiver.pendingReceivedFriendRequests.splice(receivedReqIndex, 1);
        senderModel.pendingSentFriendRequests.splice(sentReqIndex, 1);

        const newRelation = await relation.create({
            first: senderModel._id, second: receiver._id, relation: 'friends'
        });

        senderModel.relations.push(newRelation._id);
        receiver.relations.push(newRelation);

        await senderModel.save();
        await receiverModel.save();

        
        const sentSender = structuredClone(senderModel.toObject());
        delete sentSender.passWord;
        delete sentSender._id;
        server.to(userIdToSocketIdMap.get(receiver._id)).emit('friendRequestAccepted', {sender: sentSender})

    });
}