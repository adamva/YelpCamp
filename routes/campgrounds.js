const   express     = require('express'),
        Campground  = require('../models/campground'),
        Comment     = require('../models/comment'),
        middleware  = require('../middleware'),
        request     = require('request'),
        NodeGeocoder = require('node-geocoder');

const GMapAPI = 'https://maps.googleapis.com/maps/api/geocode/json?address=Edmonton&key=' + process.env.GEOCODER_API_KEY;
const quotaOptions = {
    proxy: process.env.QUOTAGUARDSTATIC_URL,
    url: GMapAPI,
};

request(quotaOptions, (err, res, body) => {
    if(!err && res.statusCode == 200){
        console.log('Hey, I went to google!');
    } else{
        console.log(err);
    }
});

const geoOptions = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
const geocoder = NodeGeocoder(geoOptions);

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
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        let lat = data[0].latitude;
        let lng = data[0].longitude;
        let location = data[0].formattedAddress;
        let newCampground = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
        // Create a new campground and save to DB
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
            } else {
                //redirect back to campgrounds page
                res.redirect("/campgrounds");
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
            res.redirect('back');
        } else {
            //Render show template with that campground
            res.render('campgrounds/show', {campground: foundCampground, GMapAPI: process.env.GEOCODER_API_KEY});
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
    geocoder.geocode(req.body.campground.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          console.log(err);
          return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + campground._id);
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