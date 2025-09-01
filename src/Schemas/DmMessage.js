import mongoose from 'mongoose';

const dmMessageSchema = new mongoose.Schema({
    senderUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    receiverUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    content: String,
    readByReceiver: { type: Boolean, default: false },
    uuid: {type:String, default: () => crypto.randomUUID()},
    sentAt: {
        type: Date,
        default: Date.now
    },
});

export const dmMessage = mongoose.model('DmMessage', dmMessageSchema);