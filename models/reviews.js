const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const reviewSchema = new Schema({
    message: {
        type: String,
        required: true
    },
    reviewby: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    posted: {
        type: Schema.Types.ObjectId,
        ref: 'Events',
        required: true
    }
    
})

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;