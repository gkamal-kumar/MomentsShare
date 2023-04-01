const mongoose = require('mongoose');
const User = require('./users');
const Schema = mongoose.Schema;

const connectionSchema = new Schema({
    Curruser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    requests: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
    
})


const Userconnect = mongoose.model('Userconnect', connectionSchema);


module.exports = Userconnect;