const   express     = require('express'),
        passport    = require('passport'),
        User        = require('../models/user')
        Campground  = require('../models/campground'),
        middleware  = require('../middleware');

const router = express.Router();

// ===========
// Register Routes
// ===========

//Show register form
router.get('/register', middleware.isProduction, (req, res) => {
    return res.render('users/register');
});

//Handle register logic
router.post('/register', middleware.isProduction, (req, res) => {
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

// ===========
// Login/Logout Routes
// ===========

//Show login form
router.get('/login', (req, res) => {
    return res.render('users/login');
});

//Check login credentials
router.post('/login', passport.authenticate('local', //.authenticate acts as a middleware and will check if a user logged in with the correct login info
    {
        successRedirect: '/campgrounds',
        successFlash: 'Logged in. Welcome!',
        failureRedirect: '/login',
        failureFlash: 'Invalid username or password.'
    })
);

//Logout route
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Logged Out');
    return res.redirect('/campgrounds');
});

// ===========
// User Routes
// ===========

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

module.exports = router;