const mongoose = require('mongoose');
const Userconnect = require('./connections');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: [true,'Email Requied']
    },
    profilepic: {
        type: String
    },
    bio: String,
    Connections: {
        type: Schema.Types.ObjectId,
        ref: 'Userconnect'
    },
    Posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Event'
    }],
    Status: {
        type: String
    }
})

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);
module.exports = User;
