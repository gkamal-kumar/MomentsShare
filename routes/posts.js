const express = require('express');
const router = express.Router();

const User = require('../models/users');
const Events = require('../models/events');
const Userconnect = require('../models/connections');
const Review = require('../models/reviews');

const multer = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });


const catchAsync = require('../utils/catchasync');
const isLoggedin = require('../middleware');


router.get('/new',isLoggedin, catchAsync( async(req, res) => {
    const passport = req.session.passport;
    var friends = null;
    if (passport) {
        const usname = passport.user;
        const user = await User.findByUsername(usname).populate('Connections');
        const id = user.Connections._id;
        const Connection = await Userconnect.findById(id).populate('friends');
        friends = Connection.friends;
    }
    res.render('./events/new' ,{friends});
}))

router.post('/',isLoggedin,upload.array('image'), catchAsync( async(req, res) => {
    const data = req.body;
    const post = new Events();
    post.message = data.Event.message;
    post.title = data.Event.title;   
    post.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    if (req.session.passport) {
        const usname = req.session.passport.user;
        const us = await User.findByUsername(usname).populate('Connections');
        const id = us.Connections._id;
        const Connection = await Userconnect.findById(id).populate('friends');
        friends = Connection.friends;
        post.user = us;
        const tags = [];
        for (let friend of friends) {
            const name = friend.username;
            if (data[name] == 'on') {
                post.friendtags.push(friend);
            }
        }
        us.Posts.push(post);
        if (data.private == 'on') {
            post.Status = "private";
        } else {
            post.Status = "public";
        }
        await post.save();
        await us.save();
        req.flash('success','Successfully Created New Post !!');
    }
    res.redirect(`./posts/${post._id}`);
}))

router.get('/all', isLoggedin,catchAsync(  async (req, res) => {
    const passport = req.session.passport;
    var posts = [];
    if (passport) {
        const usname = passport.user;
        const user = await User.findByUsername(usname).populate('Posts');
        for (let post of user.Posts) {
            const p = await Events.findById(post._id).populate('user').populate('friendtags');
            posts.push(p);
        }
    }
    res.render('./events/allevents', { passport,posts });
}))

router.delete('/:id', isLoggedin,catchAsync( async (req, res) => {
    const { id } = req.params;
    const post = await Events.findById(id);
    const usname = req.session.passport.user;
    const user = await User.findOne({ username: usname });
    const posts = user.Posts;
    const ps = posts.filter(item => item._id != id);
    user.Posts = ps;
    await user.save();
    await Events.findOneAndDelete({ _id: post._id });
    await Review.deleteMany({
        _id: {
            $in: post.reviews
        }
    })
    res.redirect('/posts/all');
}))

router.get('/shared',isLoggedin,catchAsync(  async (req, res) => {
    const passport = req.session.passport;
    var sharedposts = [];
    if (passport) {
        const usname = passport.user;
        const usr = await User.findOne({ username: usname });
        const Connection = await Userconnect.findOne({ Curruser: usr }).populate('friends');
        const friends = Connection.friends;
        for (let friend of friends) {
            const Posts = friend.Posts;
                for (let Post of Posts) {
                    Post = await Events.findById(Post).populate('user').populate('friendtags');
                    const tags = Post.friendtags;
                      if (Post.friendtags) {
                       for (let tag of tags) {
                        if (tag.username == usr.username) {
                            sharedposts.push(Post);
                            break;
                       }
                      }
                      }
                }
        } 
    }
    res.render('./events/shared',{sharedposts,passport});
}))

router.get('/edit/:id', isLoggedin, catchAsync( async (req, res) => {
    const { id } = req.params;
    const post = await Events.findById(id);
    res.render('./events/edit',{post});
}))


router.get('/:id', isLoggedin,catchAsync( async (req, res) => {
    const passport = req.session.passport;
    var currUser = null;
    const user = passport.user;
    currUser = await User.findOne({ username: user });
    const { id } = req.params;
    const post = await Events.findById(id).populate('friendtags').populate('user');
    const reviews = [];
    for (let review of post.reviews) {
        const rv = await Review.findById(review).populate('reviewby');
        reviews.push(rv);
    }
    res.render('./events/show', { post, reviews ,passport,currUser});
}))


router.put('/:id', isLoggedin, upload.array('image'), catchAsync(async (req, res) => {
    const { newmsg, title, } = req.body;
    const { id } = req.params;
    const post = await Events.findById(id);
    post.message = newmsg;
    post.title = title;
    const images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    post.images.push(...images);
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
           await  cloudinary.uploader.destroy(filename);
        }
        await  post.updateOne({
            $pull: {
                images: {
                    filename: {
                        $in: req.body.deleteImages
                    }
                }
            }
        });
    }
    await post.save();
    req.flash('success','Updated Successfully !!');

    res.redirect(`/posts/${id}`);
}))

module.exports = router;
