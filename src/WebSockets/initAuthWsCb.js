import bcrypt from 'bcrypt';
import User from '../Schemas/User.js';
import {Server} from 'socket.io';
import userIdToSocketIdMap from './userIdToSocketMap.js'


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
            .populate('joinedGcs').exec();
        
        if(!user){
            ws.emit('error', { msg: 'No Such UserName Was Found' });
            console.log('err')
            ws.disconnect(true);
            return;
        }

        const exists = bcrypt.compareSync(passWord, user.passWord);
        
        if(exists){
            user.status = 'online';
            await user.save();
            const sentUser = structuredClone(user.toObject());
            delete sentUser.passWord;
            delete sentUser._id;
            ws.emit('userInfo', sentUser);
            ws.data = user.toObject();
            userIdToSocketIdMap.set(user._id.toString(), ws.id);
            return;
        }
        ws.emit('error', {msg: 'Incorrect Password'});
        ws.disconnect();
    });
}