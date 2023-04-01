if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

/* flashes */


const express = require('express');
const mongoose = require('mongoose');

const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');

const flash = require('connect-flash');
const methodOverride = require('method-override');
const mongoSanitize = require('express-mongo-sanitize');
const app = express();

const User = require('./models/users');
const Events = require('./models/events');
const Userconnect = require('./models/connections');
const Review = require('./models/reviews');

const userroutes = require('./routes/users');
const postroutes = require('./routes/posts');
const reviewroutes = require('./routes/review');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

const dburl = process.env.DB_URL ; 
mongoose.set('strictQuery', true);
mongoose.connect(dburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4
}).then(() => {
    console.log("CONNECTION OPENED");
})
.catch((err) => {
    console.log(" MONGO ERROR EROOR OCCURED!!");
    console.log(err);
})

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(mongoSanitize({
     replaceWith: '_'
}));




const mongoStore = require("connect-mongo");
const secret = process.env.SECRET || 'Iamsecret'

const store = mongoStore.create({
    mongoUrl: dburl,
    secret,
    touchAfter: 24*60*60
})

store.on("error", function (e) {
    console.log("SESSION STORE ERROR ", e);
})

const sessionConfig = {
    store,
    name: 'session',
    secret: 'IamSecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(methodOverride('_method'));

app.use(session(sessionConfig));
app.use(flash());

const passport = require('passport');

    
app.use(async (req, res, next) => {
    var us = null;
    if (req.session.passport) {
        const name = req.session.passport.user;
        us = await User.findOne({ username: name });
        res.locals.us = us;
    }
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// home
app.get('/', (req, res) => {
    res.render('./home');
})
app.get('/home', async (req, res) => {
    let user = null;
    let posts = null;
    var friendposts = null;
    const passport = req.session.passport;
    if (passport != null ) {
        const posts = await Events.find({}).populate('friendtags').populate('user');
        user = await User.findOne({ username: passport.user }).populate('Connections');
        const connection = await Userconnect.findOne({ Curruser: user }).populate('friends');
        const friends = connection.friends;
        friendposts = [];
        for (let item of posts) {
            for (let friend of friends) {
                if (friend.username == item.user.username) {
                    friendposts.push(item);
                }
            }
        }
        res.render('./homepage', { passport , user,friendposts });
    } else {
        res.redirect('/');
    }
})


app.use('/users', userroutes);
app.use('/posts', postroutes);
app.use('/review', reviewroutes);



app.get('/login', (req, res) => {
     req.body.username = req.body.username.trim();
    res.render('./users/login');
})

app.get('/logout', (req, res) => {
    req.flash('success','Goodbye!!' );
    delete (req.session).passport;
    res.redirect('/');
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: "/login" }), async (req, res) => {
    req.flash('success', 'Welcome Back!!');
    res.redirect('/home');
})


app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('./error', { err });
})


const port = process.env.PORT || 8080;

app.listen(port, () => {
     console.log(`Serving on Port ${port}`);
})
