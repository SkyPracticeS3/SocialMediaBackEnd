import mongoose from "mongoose"

const dmSchema = new mongoose.Schema({
    first: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', index: true
    },
    second: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', index: true
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DmMessage'
    }]
});

export const dm = mongoose.model('Dm', dmSchema);