import mongoose from "mongoose";

const relationSchema = new mongoose.Schema({
    first: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    second: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    relation: {
        type: String,
        default: 'friends'
    }
});

export const relation = mongoose.model('Relation', relationSchema);