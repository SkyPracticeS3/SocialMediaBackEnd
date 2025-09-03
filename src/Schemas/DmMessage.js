import mongoose from 'mongoose';

const dmMessageSchema = new mongoose.Schema({
    senderUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},
    receiverUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},
    content: String,
    readByReceiver: { type: Boolean, default: false },
    uuid: {type:String, default: () => crypto.randomUUID(), index: true},
    sentAt: {
        type: Date,
        default: Date.now,
        index: true
    },
});

export const dmMessage = mongoose.model('DmMessage', dmMessageSchema);