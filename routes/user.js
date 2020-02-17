const   express     = require('express'),
        passport    = require('passport'),
        User        = require('../models/user')
        Campground  = require('../models/campground');;

const router = express.Router();

// ===========
// Register Routes
// ===========

//Show register form
router.get('/register', (req, res) => {
    if (process.env.CUR_ENV !== 'local') {
        req.flash('error', 'Sorry. That feature has been disabled.'); 
        return res.redirect('/');
    } else {
        res.render('users/register');
    }    
});

//Handle register logic
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

// ===========
// Login/Logout Routes
// ===========

//Show login form
router.get('/login', (req, res) => {
    res.render('users/login');
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
    res.redirect('/campgrounds');
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