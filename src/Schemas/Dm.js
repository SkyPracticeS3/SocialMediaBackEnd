import mongoose from "mongoose"

const dmSchema = new mongoose.Schema({
    first: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    second: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    messages: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DmMessage'
    }
});

export const dm = mongoose.model('Dm', dmSchema);