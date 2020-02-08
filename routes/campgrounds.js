const   express     = require('express'),
        Campground  = require('../models/campground'),
        Comment     = require('../models/comment'),
        middleware  = require('../middleware');

//This adds any routes we make to the router variable then we export it for use in app.js
const router = express.Router();

//INDEX - Show all campgrounds
router.get('/', function (req, res) {
    //Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if (err) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            res.redirect('back');
        } else {
            res.render('campgrounds/index', {campgrounds: allCampgrounds});
        }
    });    
});

//NEW - Show new campground form
router.get('/new', middleware.isLoggedIn, function (req, res) {
    res.render('campgrounds/new');
});

//CREATE - Add new campground to DB
router.post('/', middleware.isLoggedIn, function (req, res) {
    //Get data from create new campground form page
    let name = req.body.name;
    let price = req.body.price;
    let image = req.body.image;
    let desc = req.body.description;
    let author = {
        id: req.user._id,
        username: req.user.username
    };
    let newCampground = {name: name, price: price, image: image, description: desc, author: author};

    //Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if (err) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            res.redirect('back');
        } else {
            //Redirect back to campgrounds page
            res.redirect('/campgrounds');
        }
    });    
});

//SHOW - Show more info about specified campground
router.get('/:id', function(req, res){
    //Find campground with provided ID then
    //.populate.exec fills the campground's comment association IDs with acutal comment data from db
    Campground.findById(req.params.id).populate('comments').exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash('error', 'Campground not found');
            res.redirect('back');
        } else {
            //Render show template with that campground
            res.render('campgrounds/show', {campground: foundCampground});
        }
    });
});

//EDIT Campground Route
router.get('/:id/edit', middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (err) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            res.redirect('back');
        } else {
            res.render('campgrounds/edit', {campground: foundCampground});
        }        
    });       
});

//UPDATE Campground Route
router.put('/:id/', middleware.checkCampgroundOwnership, (req, res) => {
    //find and update correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground) => {
        if (err) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            res.redirect('back');
        } else {
            res.redirect('/campgrounds/' + req.params.id);
        }
    })
});

//DESTROY Campground Route
router.delete('/:id', middleware.checkCampgroundOwnership, (req, res) => {
    //Delete requested campground
    Campground.findByIdAndRemove(req.params.id, (err, deletedCampground) => {
        if (err || !deletedCampground) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            res.redirect('back');
        } else {
            //Delete any associated comments with deletedCampground
            deletedCampground.comments.forEach((comment) => {
                Comment.findByIdAndRemove(comment._id, (err, foundComment) => {
                    if (err) {
                        req.flash('error', 'Something went wrong.');
                        console.log(err.message);
                        res.redirect('back');
                    }
                });
            });
            req.flash('success', 'Campground removed.')
            res.redirect('/campgrounds');            
        }
    });
});

module.exports = router;