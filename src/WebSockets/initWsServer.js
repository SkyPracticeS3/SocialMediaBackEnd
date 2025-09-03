import {Server} from 'socket.io';
import User from '../Schemas/User.js';
import { friendRequest } from '../Schemas/FriendRequest.js'
import initAuthWsCb from './initAuthWsCb.js';
import initFriendReqSendCb from './initFriendReqSendCb.js';
import userIdToSocketIdMap from './userIdToSocketMap.js';
import { relation } from '../Schemas/Relation.js';
import initFriendReqAcceptCb from './initFriendReqAcceptCb.js';
import initUnFriendCb from './initUnFriendCb.js';
import initOpenDmCb from './initOpenDmCb.js';
import initDmMessageCb from './initDmMessageCb.js';
import initDeleteDmMessageCb from './initDeleteDmMessageCb.js';
import initEditDmMessageCb from './initEditDmMessageCb.js';

/***
 * @param {io.Server} server
 */
export default function initWsServer(server) {
    server.on('connection', ws => {
        console.log('someone tried connecting');
        
        initAuthWsCb(ws);
        initFriendReqSendCb(ws, server);
        initFriendReqAcceptCb(ws, server);
        initUnFriendCb(ws, server);
        initOpenDmCb(ws, server);
        initDmMessageCb(ws, server);
        initDeleteDmMessageCb(ws, server);
        initEditDmMessageCb(ws, server);

        ws.on('declineFriendRequest', async data => {
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
                    }]).exec();
    
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
    
            await senderModel.save();
            await receiver.save();
    
            await friendRequest.findByIdAndDelete(sentReq._id);
    
            ws.data = receiver.toObject();
    
            
            const sentReceiver = (receiver.toObject());
            server.to(userIdToSocketIdMap.get(senderModel._id.toString())).emit('friendRequestDeclined', {decliner: sentReceiver})    
        });
        ws.on('disconnect', async reason => {
            if(ws.data._id){
                const actualUser = await User.findById(ws.data._id);
                actualUser.status = 'offline';
                actualUser.save();
                userIdToSocketIdMap.delete(ws.data._id.toString());
            }
        });
    });
};