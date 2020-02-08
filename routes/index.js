const   express     = require('express'),
        passport    = require('passport'),
        User        = require('../models/user');

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
    res.render('register');
});

//Handle sign up logic
router.post('/register', (req, res) => {
    let newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            req.flash('error', err.message); 
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
})

// ===========
// Error Routes
// ===========

//Error - Page could not be found
router.get('*', function (req, res) { 
    res.send('page not found');
});

module.exports = router;