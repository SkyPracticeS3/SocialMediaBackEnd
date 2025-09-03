import mongoose from "mongoose";

const relationSchema = new mongoose.Schema({
    first: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', index: true
    },
    second: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', index: true
    },
    relation: {
        type: String,
        default: 'friends'
    }
});

export const relation = mongoose.model('Relation', relationSchema);