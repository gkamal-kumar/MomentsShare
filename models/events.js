const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});


ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_300');
});

const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    images: [ImageSchema],
    message: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friendtags: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    Status: {
        type:String
    }
})
const Event = mongoose.model('Event', eventSchema);






module.exports = Event;
