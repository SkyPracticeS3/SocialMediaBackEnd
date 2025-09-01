import { Router } from "express"
import User from "../Schemas/User.js";
import {fileURLToPath} from 'url';
import path, { dirname } from "path";
import fs from 'fs';
import bcrypt from 'bcrypt';
import { fileUploader } from "../Storage/fileStorage.js";
import {dm} from '../Schemas/Dm.js'

const dirName = dirname(fileURLToPath(import.meta.url));
const DmRouter = Router();




DmRouter.get('/:first/:second/msgs', async (req, res) => {
    const firstName = req.params.first;
    const secondName = req.params.second;
    const limit = req.query.limit;

    const firstUser = await User.findOne().where('userName').equals(firstName).lean();
    if(!firstUser) {
        res.status(404).json({err: 'First User Not Found'});
        return;
    }
    delete firstUser.passWord;

    const secondUser = await User.findOne().where('userName').equals(secondName).lean();
    if(!secondUser){
        res.status(404).json({err: 'Second User Not Found'});
        return;
    }
    delete secondUser.passWord;

    const openDm = await dm.findOne({
  first: { $in: [firstUser._id, secondUser._id] },
  second: { $in: [firstUser._id, secondUser._id] }
}).populate('messages').lean();
    openDm.messages = openDm.messages.map(e => {
        if(e.senderUser.equals(firstUser._id)){
            return {senderUser: firstUser.userName, sentAt: e.sentAt,
                readByReceiver: e.readByReceiver, content: e.content
            };
        }

        return {senderUser: secondUser.userName, sentAt: e.sentAt,
                readByReceiver: e.readByReceiver, content: e.content
            };
    })
    
    res.json(openDm.messages);
});





export default DmRouter;