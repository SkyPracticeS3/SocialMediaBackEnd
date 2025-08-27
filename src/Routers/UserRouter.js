import { Router } from "express"
import User from "../Schemas/User.js";
import {fileURLToPath} from 'url';
import path, { dirname } from "path";
import fs from 'fs';
import bcrypt from 'bcrypt';
import { fileUploader } from "../Storage/fileStorage.js";

const dirName = dirname(fileURLToPath(import.meta.url));
const userRouter = Router();

userRouter.get('/:name', async (req, res) => {
    const userName = req.params.name;
    const user = await User.findOne().where('userName').equals(userName).populate('relations').
        populate('joinedServers').lean().exec();

    if(!user){
        res.json({exists : false});
        return;
    }
    delete user.passWord;
    res.json(user);
});

userRouter.get('/contains/:name', async (req, res) => {
    const users = await User.find().where('userName').regex(new RegExp(req.params.name)).lean();
    for(const user of users){
        delete user._id;
        delete user.email;
        delete user.joinedGcs;
        delete user.passWord;
        delete user.pendingSentFriendRequests;
        delete user.pendingReceivedFriendRequests;
        delete user.phoneNum;
        delete user.__v;
    }
    res.json(users);
});

userRouter.get('/:name/pfp', async (req, res) => {
    const userName = req.params.name;
    const user = await User.findOne().where('userName').equals(userName).exec();

    if(!user){
        res.json({exists : false});
        return;
    }
    
    res.sendFile(path.join(path.dirname(dirName), 'pfps', user.pfp));
});

userRouter.post('/login', async(req, res) => {
    const userName = req.body.userName;
    const passWord = req.body.passWord;

    const user = await User.findOne().where({userName: userName}).lean();
    if(!user){
        res.json({succeeded: false});
        return;
    }
    const exists = bcrypt.compare(passWord, user.passWord);

    res.json({succeeded: exists});
});

userRouter.post('/register', fileUploader.single('pfp'), async(req, res) => {
    const email = req.body.email;
    const userName = req.body.userName;
    const displayName = userName;
    const passWord = await bcrypt.hash(req.body.passWord, 12);
    const phoneNum = req.body.phoneNum;
    const status = 'offline';
    const pfpName = userName;
    console.log(email, userName, displayName, passWord, phoneNum, status, pfpName);

    const exists = await User.exists().where({userName: userName});

    if(exists){
        res.json({succeeded: false});
        if(req.file){
            await fs.promises.unlink(req.file.path);
        }
        return;
    }

    const newName = path.join(path.dirname(req.file.path), userName + path.extname(req.file.originalname).toLowerCase());
    fs.promises.rename(req.file.path, newName);

    const mhm = await User.create({
        email: email, userName: userName, passWord: passWord, displayName: displayName,
        phoneNum: phoneNum, status: status, pfp: userName + path.extname(req.file.originalname)
    });

    res.json({succeeded: true});
});

userRouter.delete('/', async (req, res) => {
    const userName = req.query.userName;
    const passWord = req.query.passWord;

    const user = await User.findOne().where({userName: userName}).lean();
    const exists = bcrypt.compare(passWord, user.passWord);

    if(exists){
        await User.findByIdAndDelete(user._id);
        res.json({succeeded: true});
        return;
    }
    res.json({succeeded: false});
})

export default userRouter;