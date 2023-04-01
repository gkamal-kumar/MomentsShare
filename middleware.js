const isLoggedin = function(req, res, next) {
    const passport = req.session.passport;
    if (!passport) {
        req.flash('error', 'you must be signed in');
        return res.redirect('/login'); 
    }
    return next();
} 
module.exports = isLoggedin;
