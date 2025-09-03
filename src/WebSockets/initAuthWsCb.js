import bcrypt from 'bcrypt';
import User from '../Schemas/User.js';
import {Server} from 'socket.io';
import userIdToSocketIdMap from './userIdToSocketMap.js'
import mongoose from 'mongoose';

function uint8ArrayToHexString(uint8Array) {
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function initAuthWsCb(ws){
    ws.on('authInfo', async (data) => {
        const userName = data.userName;
        const passWord = data.passWord;
    
        const user = await User.findOne().where({userName: userName}).populate({
            path: 'relations',
            populate: [{path: 'first'}, {path: 'second'}]
        })
                .populate([{
                    path: 'pendingSentFriendRequests',
                    populate:{
                        path: 'receiverUser'
                    }
                },
                {
                    path: 'pendingReceivedFriendRequests',
                    populate:{
                        path: 'senderUser'
                    }
                }])
            .populate({path: 'openedDms', populate:[{path: 'first'}, {path: 'second'}]}).exec();
        if(!user){
            ws.emit('error', { msg: 'No Such UserName Was Found' });
            console.log('err')
            ws.disconnect(true);
            return;
        }
        delete user.passWord;
        const exists = bcrypt.compareSync(passWord, user.passWord);
        
        if(exists){
            user.status = 'online';
            await user.save();
            const sentUser = user.toObject();

            sentUser.openedDms = sentUser.openedDms.map(e => { return ({first: e.first, second: e.second, _id: e.uuid})});
            ws.emit('userInfo', (sentUser));
            ws.data = user.toObject();
            userIdToSocketIdMap.set(user._id.toString(), ws.id);
            return;
        }
        ws.emit('error', {msg: 'Incorrect Password'});
        ws.disconnect();
    });
}