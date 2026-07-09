const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { 
        type: String,
         default: '' },
    lastName: { 
        type: String, 
        default: '' },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength:3
    },
    email:{
        type:String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength:6
    },
    avatar: {
        type: String,
        deafult: ''
    },
     bio: {
    type: String,
    default: '',
    maxlength: 150
   },
   isPrivate: {
    type: Boolean,
    default: false
   },
    isOnline: {
        type: Boolean,
        default: false
    }
}, {timestamps: true }); //adds createdAt and updatedAt automatically

module.exports = mongoose.model('User', userSchema);

