import {Server} from 'socket.io';
import User from '../Schemas/User.js';
import { friendRequest } from '../Schemas/FriendRequest.js'
import initAuthWsCb from './initAuthWsCb.js';
import initFriendReqSendCb from './initFriendReqSendCb.js';
import userIdToSocketIdMap from './userIdToSocketMap.js';
import { relation } from '../Schemas/Relation.js';
import initFriendReqAcceptCb from './initFriendReqAcceptCb.js';

/***
 * @param {io.Server} server
 */
export default function initWsServer(server) {
    server.on('connection', ws => {
        console.log('someone tried connecting');
        initAuthWsCb(ws);
        initFriendReqSendCb(ws, server);
        initFriendReqAcceptCb(ws, server);

        ws.on('declineFriendRequest', async data => {
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
    
            await senderModel.save();
            await receiverModel.save();
        });
        ws.on('disconnect', async ws => {
            if(ws.data){
                ws.data.status = 'offline';
                ws.data.save();
                userIdToSocketIdMap.delete(ws.data._id);
            }
        });
    });
};