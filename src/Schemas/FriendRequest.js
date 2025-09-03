import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
    senderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    receiverUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    state: { type: String, default: 'pending' },
    sentAt: {
        type: Date,
        default: Date.now
    }
});

export const friendRequest = mongoose.model('FriendRequest', friendRequestSchema);