const   express     = require('express'),
        Campground  = require('../models/campground'),
        Comment     = require('../models/comment'),
        middleware  = require('../middleware'),
        geocode     = require('../middleware/geocoder');

//This adds any routes we make to the router variable then we export it for use in app.js
const router = express.Router();

//INDEX - Show all campgrounds
router.get('/', function (req, res) {
    //Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if (err) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            return res.redirect('back');
        } else {
            return res.render('campgrounds/index', {campgrounds: allCampgrounds});
        }
    });    
});

//NEW - Show new campground form
router.get('/new', middleware.isLoggedIn, function (req, res) {
    return res.render('campgrounds/new');
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
    geocode.geocode(req.body.location, (data) => {
        if(!data.length){
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        let location = data[0].formatted_address;
        let lat = data[0].geometry.location.lat;
        let lng = data[0].geometry.location.lng;
        let newCampground = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
        Campground.create(newCampground, function(err, newlyCreated){
            if(err || !newlyCreated){
                req.flash('error', 'Opps, something went wrong.')
                return res.redirect('back');
            } else {
                req.flash('success', 'Success! New campground added.')
                return res.redirect("/campgrounds/" + newlyCreated.id);
            }
        });
    });
});

//SHOW - Show more info about specified campground
router.get('/:id', function(req, res){
    //Find campground with provided ID then
    //.populate.exec fills the campground's comment association IDs with acutal comment data from db
    Campground.findById(req.params.id).populate('comments').exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash('error', 'Campground not found');
            return res.redirect('back');
        } else {
            //Render show template with that campground
            return res.render('campgrounds/show', {campground: foundCampground, GMapAPI: process.env.GMAPS_API_KEY});
        }
    });
});

//EDIT Campground Route
router.get('/:id/edit', middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (err) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            return res.redirect('back');
        } else {
            return res.render('campgrounds/edit', {campground: foundCampground});
        }        
    });       
});

//UPDATE Campground Route
router.put('/:id/', middleware.checkCampgroundOwnership, (req, res) => {
    geocode.geocode(req.body.campground.location, function (data) {
        if (!data.length) {
          req.flash('error', 'Invalid address');
          console.log(err);
          return res.redirect('back');
        }

        req.body.campground.lat = data[0].geometry.location.lat;
        req.body.campground.lng = data[0].geometry.location.lng;
        req.body.campground.location = data[0].formatted_address;

        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                return res.redirect("/campgrounds/" + campground._id);
            }
        });
    });
});

//DESTROY Campground Route
router.delete('/:id', middleware.checkCampgroundOwnership, (req, res) => {
    //Delete requested campground
    Campground.findByIdAndRemove(req.params.id, (err, deletedCampground) => {
        if (err || !deletedCampground) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            return res.redirect('back');
        } else {
            //Delete any associated comments with deletedCampground
            deletedCampground.comments.forEach((comment) => {
                Comment.findByIdAndRemove(comment._id, (err, foundComment) => {
                    if (err) {
                        req.flash('error', 'Something went wrong.');
                        console.log(err.message);
                        return res.redirect('back');
                    }
                });
            });
            req.flash('success', 'Campground removed.')
            return res.redirect('/campgrounds');            
        }
    });
});

module.exports = router;