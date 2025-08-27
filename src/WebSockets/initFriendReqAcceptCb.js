import bcrypt from 'bcrypt';
import User from '../Schemas/User.js';
import { relation } from '../Schemas/Relation.js';
import {friendRequest} from '../Schemas/FriendRequest.js'
import userIdToSocketIdMap from './userIdToSocketMap.js';

export default function initFriendReqAcceptCb(ws, server) {
    ws.on('acceptFriendRequest', async data => {
        if(ws.data == null){
            ws.emit('error', {msg: 'Authenticate First'});
            ws.disconnect();
            return;
        }
        const sender = data;
        const senderModel = await User.findOne().where('userName').equals(data.userName).populate(
            {path: 'pendingSentFriendRequests', populate: [{path: 'senderUser'}, {path: 'receiverUser'}]}).exec();
        const receiverr = ws.data;
        const receiver = await User.findById(receiverr._id).populate({
            path: 'relations',
            populate: [{path: 'first'}, {path: 'second'}]
        })
                .populate([{
                    path: 'pendingSentFriendRequests',
                    populate:{
                        path: 'receiverUser',
                        path: 'senderUser'
                    }
                },
                {
                    path: 'pendingReceivedFriendRequests',
                    populate:{
                        path: 'senderUser',
                        path: 'receiverUser'
                    }
                }])
            .populate('joinedGcs').exec();

        console.log(receiver)
        console.log(senderModel)
        const sentReqIndex = senderModel.pendingSentFriendRequests.findIndex(e => receiver._id.equals(e.receiverUser._id));

        if(sentReqIndex == -1){
            ws.emit('error', {msg: 'No Such Friend Request'});
            console.log('no such friend req')
            return;
        }

        const sentReq = senderModel.pendingSentFriendRequests[sentReqIndex];

        const receivedReqIndex = receiver.pendingReceivedFriendRequests.findIndex(e => e.senderUser._id.equals(senderModel._id));

        receiver.pendingReceivedFriendRequests.splice(receivedReqIndex, 1);
        senderModel.pendingSentFriendRequests.splice(sentReqIndex, 1);

        const newRelation = await relation.create({
            first: senderModel._id, second: receiver._id, relation: 'friends'
        });

        senderModel.relations.push(newRelation._id);
        receiver.relations.push(newRelation._id);

        await senderModel.save();
        await receiver.save();

        await friendRequest.findByIdAndDelete(sentReq._id);

        ws.data = receiver.toObject();

        
        const sentReceiver = structuredClone(receiver.toObject());
        delete sentReceiver.passWord;
        server.to(userIdToSocketIdMap.get(senderModel._id.toString())).emit('friendRequestAccepted', {acceptor: receiver})

    });
}