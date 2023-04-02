const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const catchAsync = require('../utils/catchasync');
const ExpressError = require('../utils/ExpressError');

const User = require('../models/users');
const Events = require('../models/events');
const Userconnect = require('../models/connections');
const Review = require('../models/reviews');

const passport = require('passport');
const LocalStrategy = require('passport-local');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// const GoogleStragegy = require('passport-google-oauth2').Strategy;

// passport.use(new GoogleStragegy({
//     clientID: process.env.GOOGLE_CLIENTID,
//     clientSecret: process.env.GOOGLE_CLIENTSECRET,
//     callbackURL: process.env.GOOGLE_CALLBACKURL,
//     passReqToCallback: true
// }, function (request, accessToken, refreshToken, profile, done) {
//     return done(null,profile)
// }))


// router.use(passport.session());
// router.use(passport.initialize());

const { UserSchema } = require('../schemas');
const isLoggedin = require('../middleware');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });


const validateusers = (req, res, next) => {
    const { error } = UserSchema.validate(req.body);
    console.log(error);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}


// router.get('/google', passport.authenticate('google',{scope:['profile','email']}), (req, res) => {
    
// })

// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
//     res.redirect('/home');
// })


router.post('/search',isLoggedin, catchAsync(async (req, res) => {
    const passport = req.session.passport;
    var searchfriends = [];
    const currusr = await User.findOne({ username: passport.user });
    const alluser = await User.find({ "username": { $regex: ".*" + req.body.username + ".*" } });
    const curruser = await Userconnect.findOne({ Curruser: currusr }).populate('friends');
    const friends = curruser.friends;
    for (let user of alluser) {
        for (let friend of friends) {
            if (friend.username == user.username) {
                searchfriends.push(user);
            }
        }
    }
    res.render('./users/friends',{passport,friends:searchfriends});
}))

router.get('/register',(req, res) => {
    res.render('./users/register');
})

router.post('/',validateusers,catchAsync( async (req, res) => {
    const Users = req.body.User;
    Users.username = Users.username.trim();
    const newConnection = new Userconnect();
    const user = new User({ email: Users.email, bio: Users.bio, username: Users.username ,Status: Users.status });
    const newUser = await User.register(user, Users.password);
    newUser.Connections = newConnection;
    await newUser.save();
    newConnection.Curruser = newUser;
    await newConnection.save();
    if (req.session) {
        req.session.passport = { user: Users.username };
        req.flash('success','Welcome !!');
    }
    res.redirect('/home');
}))


router.get('/friends',isLoggedin, catchAsync(async (req, res) => {
    const passport = req.session.passport;
    var friends = null;
    if (passport) {
        const usname = passport.user;
        const user = await User.findByUsername(usname).populate('Connections');
        const id = user.Connections._id;
        const Connection = await Userconnect.findById(id).populate('friends');
        friends = Connection.friends;
    }

    res.render('./users/friends',{passport,friends});
}))

function arrayremove(arr, value) {
    return arr.filter(function (ele) {
        return ele != value;
    })
}
function requestuser(allconnects, user) {
    const requser = [];
    for (let connect of allconnects){
        const friends = connect.requests;
        for (let request of friends) {
            if (request.username == user.username) {
                requser.push(connect.Curruser);
                break;
            }
        }
    }
    return requser;
}
router.get('/add',isLoggedin,catchAsync( async (req, res) => {
    let allusers = await User.find({});
    let passport = usn = req.session.passport 
    if (passport) {
        const user = passport.user;
        usn = await User.findOne({ username: user });
        const Connection = await Userconnect.find({ Curruser: usn }).populate('friends').populate('requests');
        const Friends = Connection[0].friends; 
        const requests = Connection[0].requests;
        const allConnections = await Userconnect.find({}).populate('requests').populate('Curruser');
        const reqs = requestuser(allConnections, usn);
        Friends.push.apply(Friends, reqs); 
        Friends.push.apply(Friends, requests);  
        for (let friend of Friends) {
            allusers = allusers.filter(item => item.username != friend.username);
        }
    }
    res.render('./users/addusers', { allusers ,passport ,usn });
}))

router.post('/add',isLoggedin,catchAsync( async (req, res) => {
    if (req.session.passport) {
        const { friend_id } = req.body;
        const frienduser = await User.findById(friend_id);
        const usname = req.session.passport.user;
        const user = await User.findByUsername(usname);
        const Connection = await Userconnect.findOne({ Curruser: user });
        Connection.requests.push(frienduser);
        await Connection.save();
        req.flash('success', 'Request Sent');
        res.redirect('/users/add');
    } else {
        res.redirect('/login');
    }
}))

router.get('/requests',isLoggedin,catchAsync( async (req, res) => {
    var allconnects = await Userconnect.find({}).populate('requests').populate('Curruser');
    const passport = req.session.passport;
    if (passport) {
        const usname = req.session.passport.user;
        const user = await User.findByUsername(usname);
        allconnects = requestuser(allconnects,user);
    }
    res.render('./users/requests', { passport, allconnects });
}))

router.post('/requests',isLoggedin,catchAsync(async (req, res) => {
    const { friend_id } = req.body;
    const frienduser = await User.findById(friend_id);
    if (req.session.passport) {
        const usname = req.session.passport.user;
        const user = await User.findByUsername(usname);
        const Connection = await Userconnect.findOne({ Curruser: frienduser }).populate('requests').populate('Curruser');
        Connection.friends.push(user);
        const Connection2 = await Userconnect.findOne({ Curruser: user });
        Connection2.friends.push(frienduser);
        const reqs = Connection.requests;
        Connection.requests = reqs.filter(item => item.username != user.username) 
        await Connection.save();
        await Connection2.save();
        req.flash('success', 'New friend added');
    }
    res.redirect('/users/requests');
}))


router.get('/addpic', isLoggedin, catchAsync(async (req, res) => {
    const user = await User.findOne({ username: req.session.passport.user });
    res.render('./users/addprofile',{user});
}))


router.post('/addpic', isLoggedin, upload.single('image'), catchAsync(async (req, res) => {
    const user = await User.findOne({ username: req.session.passport.user });
    user.profilepic = req.file.path;
    await user.save();
    req.flash('success','Profile Picture Added !!');
    res.redirect(`/users/${user._id}`);
}))

router.delete('/addpic', isLoggedin, catchAsync(async (req, res) => {
    const user = await User.findOne({ username: req.session.passport.user });
    user.profilepic = null;
    await user.save();
    req.flash('success','Profile Picture Removed !!');
    res.redirect(`/users/${user._id}`);
}))



router.get('/:id', isLoggedin,catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate('Posts');
    const Connection = await Userconnect.findOne({ Curruser: user }).populate('friends');
    const Friends = Connection.friends;
    const usname = req.session.passport.user;
    const Curruser = await User.findOne({ username: usname }).populate('Posts');;
    res.render('./users/profile', { user,Friends,Curruser});
}))

router.get('/edit/:id',isLoggedin,catchAsync( async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    res.render('./users/update', { user });
}))

router.put('/:id', isLoggedin,catchAsync(async (req, res) => {
        const user = req.body.User;
        const { id } = req.params;
        const curruser = await User.findById(id);
        curruser.username = user.username;
        curruser.email = user.email;
        curruser.bio = user.bio;
        req.session.passport.user = curruser.username;
        await curruser.save();
        req.flash('success', 'Successfully Updated');
        res.redirect(`/users/${id}`);
    res.redirect('/login');
}))



module.exports = router;
