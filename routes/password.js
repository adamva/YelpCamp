const   express     = require('express'),
        User        = require('../models/user')
        async       = require('async'),
        nodemailer  = require('nodemailer'),
        crypto      = require('crypto');

const router = express.Router();

// ===========
// Forgot Password Routes
// ===========

//Forgot passwrod
router.get('/forgot', (req, res) => {
    return res.render('users/forgot');
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
        return res.redirect('/forgot');
    });
});

// ===========
// Reset Password Routes
// ===========

//Reset password
router.get('/reset/:token', (req, res) => {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
        if(err || !user){
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        } else {
            return res.render('users/reset', {token: req.params.token});
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
        return res.redirect('/campgrounds');
    });
});

module.exports = router;