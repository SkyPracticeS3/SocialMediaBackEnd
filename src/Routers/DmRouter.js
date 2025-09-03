import { Router } from "express"
import User from "../Schemas/User.js";
import {fileURLToPath} from 'url';
import path, { dirname } from "path";
import { dmMessage } from "../Schemas/DmMessage.js";
import fs from 'fs';
import bcrypt from 'bcrypt';
import { fileUploader } from "../Storage/fileStorage.js";
import {dm} from '../Schemas/Dm.js'

const dirName = dirname(fileURLToPath(import.meta.url));
const DmRouter = Router();




DmRouter.get('/:first/:second/msgs', async (req, res) => {
    const firstName = req.params.first;
    const secondName = req.params.second;
    const limit = Number(req.query.limit);
    const skipAmount = Number(req.query.skip != null ? req.query.skip : '0');

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

    let msgs = await dmMessage.find({senderUser: { $in: [firstUser._id, secondUser._id] },
  receiverUser: { $in: [firstUser._id, secondUser._id] }}).sort({sentAt: -1}).skip(skipAmount).limit(limit).lean();
    msgs.reverse();
    msgs = msgs.map(e => {
        if(e.senderUser.equals(firstUser._id)){
            return {senderUser: firstUser.userName, sentAt: e.sentAt,
                readByReceiver: e.readByReceiver, content: e.content, uuid: e.uuid
            };
        }

        return {senderUser: secondUser.userName, sentAt: e.sentAt,
                readByReceiver: e.readByReceiver, content: e.content, uuid: e.uuid
            };
    })
    
    res.json(msgs);
});





export default DmRouter;