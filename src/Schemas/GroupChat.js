import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema({
    ownerUserName: String,
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const groupChat = mongoose.model('GroupChat', groupChatSchema);