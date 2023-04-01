const express = require('express');

const router = express.Router();

const User = require('../models/users');
const Events = require('../models/events');
const Review = require('../models/reviews');
const { reviewSchema } = require('../schemas');
const isLoggedin = require('../middleware');

const  ExpressError  = require('../utils/ExpressError');
const catchAsync = require('../utils/catchasync');



router.post('/new', isLoggedin,catchAsync(async (req, res) => {
    const { post_id } = req.body;
    const message = req.body.review.message;
    const passport = req.session.passport;
    if (passport) {
        const usname = passport.user;
        const user = await User.findOne({ username: usname });
        const post = await Events.findOne({ _id: post_id });
        const newReview = new Review({ message: message, reviewby: user, posted: post });
        await newReview.save();
        post.reviews.push(newReview);
        await post.save();
    }
    res.redirect(`/posts/${post_id}`);
}))

router.delete('/:id', isLoggedin, catchAsync(async (req, res) => {
    const { id } = req.params;
    const review = await Review.findById(id);
    const post = await Events.findById(review.posted).populate('reviews');
    await Review.deleteOne({ _id: review._id });
    const reviews = post.reviews.filter(item => item._id != id);
    post.reviews = reviews;
    await post.save();
    res.redirect(`/posts/${post._id}`);
}))


module.exports = router;