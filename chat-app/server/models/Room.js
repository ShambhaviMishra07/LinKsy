const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default:''
    },
    createdBy: [{
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        content: String,
        sender: String,
        createdAt: Date
    }
} ,{timestamps: true});

module.exports = mongoose.model('Room', roomSchema);