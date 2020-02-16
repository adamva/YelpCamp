const   express     = require('express'),
        passport    = require('passport'),
        User        = require('../models/user')
        Campground  = require('../models/campground'),
        async       = require('async'),
        nodemailer  = require('nodemailer'),
        crypto      = require('crypto');

const router = express.Router();

//Root route
router.get('/', function (req, res) {
    res.render('landing');
});

// ===========
// Auth Routes
// ===========

//Show register form
router.get('/register', (req, res) => {
    if (process.env.CUR_ENV !== 'local') {
        req.flash('error', 'Sorry. That feature has been disabled.'); 
        return res.redirect('/');
    } else {
        res.render('register');
    }    
});

//Handle sign up logic
router.post('/register', (req, res) => {
    let newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email
    });
    if(req.user && req.user.isAdmin){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err, user) => {
        if (err || process.env.CUR_ENV !== 'local') {
            req.flash('error', 'Opps, something went wrong.'); 
            return res.redirect('/register');
        } else{
            //after creating new user, log them in
            passport.authenticate('local')(req, res, () => {
                req.flash('success', 'Welcome to YelpCamp ' + user.username + '.'); 
                res.redirect('/campgrounds');
            });
        }
    });
});

//Show login form
router.get('/login', (req, res) => {
    res.render('login');
});

//Check login credentials
router.post('/login', passport.authenticate('local', //.authenticate acts as a middleware and will check if a user logged in with the correct login info
    {
        successRedirect: '/campgrounds',
        failureRedirect: '/login',
        failureFlash: 'Invalid username or password.'
    })
);

//Logout route
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Logged Out');
    res.redirect('/campgrounds');
});

//Forgot passwrod
router.get('/forgot', (req, res) => {
    res.render('forgot');
});

//Handle forgot password logic
router.post('/forgot', (req, res, next) => {
    async.waterfall([
        function(done){
            crypto.randomBytes(20, (err, buf) => {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({email: req.body.email}, (err, user) => {
                if(err || !user){
                    req.flash('error', 'No account with that email address exists');
                    return res.redirect('/forgot');
                } else {
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; //1 hour

                    user.save((err) => {
                        done(err, token, user);
                    });
                }
            });
        },
        function(token, user, done){
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth:{
                    user: process.env.GMAIL_UN,
                    pass: process.env.GMAIL_PW
                }
            });
            let mailOptions = {
                to: user.email,
                from: process.env.GMAIL_UN,
                subject: 'Node.js YelpCamp Password Reset Request',
                text: 'Forgot your password? Don\'t worry, it happens to all of us. \n\n' +
                'Please click on the following link to reset your password. \n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'This link will expire in 1 hour. \n\n' +
                'If you did not request a password reset, please ignore this email.'
            }
            smtpTransport.sendMail(mailOptions, (err) => {
                console.log('mail sent');
                req.flash('success', 'An email has been sent to ' + user.email + ' with futher instructions.');
                done(err, 'done');
            });
        }
    ], function(err){
        if(err){
            return next(err);
        }
        res.redirect('/forgot');
    });
});

//Reset password
router.get('/reset/:token', (req, res) => {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
        if(err || !user){
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        } else {
            res.render('reset', {token: req.params.token});
        }
    });
});

//Handle reset password logic
router.post('/reset/:token', (req, res) => {
    async.waterfall([
        function(done){
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
                if(err || !user){
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('/forgot');
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, (err) => {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save((err) => {
                            req.logIn(user, (err) => {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash('error', 'Passwords do not match.');
                    return res.redirect('back');
                }
            });  
        },
        function(user, done){
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth:{
                    user: process.env.GMAIL_UN,
                    pass: process.env.GMAIL_PW
                }
            });
            let mailOptions = {
                to: user.email,
                from: process.env.GMAIL_UN,
                subject: 'Node.js YelpCamp You Password Has Changed',
                text: 'Hey, just letting you know that your password has changed for account: ' + user.email +' \n\n' +
                'If you did not change your password for this account, then someone else might have access to your account. \n\n' +
                'It is highly suggested to change your password by following this link: \n\n' +
                'http://' + req.headers.host + '/forgot'
            }
            smtpTransport.sendMail(mailOptions, (err) => {
                req.flash('success', 'Sucess! Your password has been changed.');
                done(err);
            });
        }
    ], function(err){
        res.redirect('/campgrounds');
    });
});

//User Profile
router.get('/users/:id', (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if (err || !foundUser) {
            req.flash('error', 'Could not find user');
            return res.redirect('/');
        }
        Campground.find().where('author.id').equals(foundUser._id).exec((err, campgrounds) => {
            if (err) {
                req.flash('error', 'Something went wrong');
                return res.redirect('/');
            }
            res.render('users/show', {user: foundUser, campgrounds: campgrounds});
        });
    })
});

// ===========
// Error Routes
// ===========

//Error - Page could not be found
router.get('*', function (req, res) { 
    res.send('page not found');
});

module.exports = router;