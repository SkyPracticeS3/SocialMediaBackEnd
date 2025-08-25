import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: String,
    pfp: String,
    userName: {
        type: String,
        index: true
    },
    displayName: {
        type: String,
        index: true 
    },
    status: { type: String, default: 'offline' },
    description: String,
    passWord: String,
    phoneNum: String,
    pendingReceivedFriendRequests: [{type: mongoose.Schema.Types.ObjectId, ref: "FriendRequest"}],
    pendingSentFriendRequests: [{type: mongoose.Schema.Types.ObjectId, ref: "FriendRequest"}],
    joinedGcs: [{type: mongoose.Schema.Types.ObjectId, ref: 'GroupChat'}],
    relations: [{type: mongoose.Schema.Types.ObjectId, ref: 'Relation'}]
});

const User = mongoose.model('User', userSchema);
export default User;