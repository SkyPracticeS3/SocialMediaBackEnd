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
    uuid: {
        type: String,
        default: () => crypto.randomUUID(),
        unique: true
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DmMessage'
    }]
});

export const dm = mongoose.model('Dm', dmSchema);