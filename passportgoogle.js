const passport = require('passport');

const GoogleStragegy = require('passport-google-oauth2').Strategy;

passport.serializeUser(function (user, done) {
    return done(null, user);
})
passport.deserializeUser(function (user, done) {
   return  done(null, user);
})



passport.use(new GoogleStragegy({
    clientID: process.env.GOOGLE_CLIENTID,
    clientSecret: process.env.GOOGLE_CLIENTSECRET,
    callbackURL: process.env.GOOGLE_CALLBACKURL,
    passReqToCallback: true,
    scope: [ 'profile' ]
}, function (request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    return done(null,profile)
}))


/*
code=4%2F0AWtgzh7XEjaOuLBZE1VdS_zncB2rY8JI3Ndif-iQQrVPR2TUXySqUDazPEIDY8Qa8U_RVw&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+openid&authuser=0&prompt=consent
*/