const   express     = require('express'),
        Campground  = require('../models/campground'),
        Comment     = require('../models/comment'),
        middleware  = require('../middleware'),
        geocode     = require('../middleware/geocoder'),
        upload      = require('../upload/multer'),
        cloudinary  = require('../upload/cloudinary');

//This adds any routes we make to the router variable then we export it for use in app.js
const router = express.Router();

//INDEX - Show all campgrounds
router.get('/', function (req, res) {
    let noMatch;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');

        Campground.find({name: regex}, function(err, allCampgrounds){
            if (err) {
                req.flash('error', 'Something went wrong.');
                console.log(err.message);
                return res.redirect('back');
            } else {
                if(allCampgrounds.length < 1){
                    noMatch = 'No campgrounds found.'
                }
                return res.render('campgrounds/index', {campgrounds: allCampgrounds, noMatch: noMatch});
            }
        });
    } else {
        //Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
            if (err) {
                req.flash('error', 'Something went wrong.');
                console.log(err.message);
                return res.redirect('back');
            } else {
                return res.render('campgrounds/index', {campgrounds: allCampgrounds, noMatch: noMatch});
            }
        });  
    }  
});

//NEW - Show new campground form
router.get('/new', middleware.isLoggedIn, function (req, res) {
    return res.render('campgrounds/new');
});

//CREATE - Add new campground to DB
router.post('/', middleware.isLoggedIn, upload.single, async function (req, res) {
    try {
        let data = await geocode.geocode2(req.body.campground.location);
        if (!data.length){
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        let result = await cloudinary.uploads(req.file.path, process.env.CLOUDINARY_MEDIA_FOLDER);

        req.body.campground.lat = data[0].geometry.location.lat;
        req.body.campground.lng = data[0].geometry.location.lng;
        req.body.campground.location = data[0].formatted_address;

        req.body.campground.image = result.url;
        req.body.campground.imageId = result. publicId;
        
        req.body.campground.author = {id: req.user._id, username: req.user.username};
        
        let newCampground = await Campground.create(req.body.campground);

        req.flash("success","New campground added!");
        return res.redirect("/campgrounds/" + newCampground._id);

    } catch (err) {
        req.flash('error', err.message)
        return res.redirect('back');
    }
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
router.put('/:id/', middleware.checkCampgroundOwnership, upload.single, async (req, res) => {
    try {
        let campground = await Campground.findById(req.params.id);
        if(req.file){
            await cloudinary.destroy(campground.imageId)
            let result = await cloudinary.uploads(req.file.path, process.env.CLOUDINARY_MEDIA_FOLDER);
            campground.image = result.url;
            campground.imageId = result. publicId; 
        }
        if (campground.location !== req.body.location){
            let data = await geocode.geocode2(req.body.location);
            if (!data.length){
                req.flash('error', 'Invalid address');
                return res.redirect('back');
            }
            campground.lat = data[0].geometry.location.lat;
            campground.lng = data[0].geometry.location.lng;
            campground.location = data[0].formatted_address;
        }
        campground.name = req.body.name;
        campground.price = req.body.price;
        campground.description = req.body.description;
        campground.save();
        req.flash("success","Successfully Updated!");
        return res.redirect("/campgrounds/" + campground._id);

    } catch (error) {
        req.flash('error', err.message);
        return res.redirect('back');
    }      
});

//DESTROY Campground Route
router.delete('/:id', middleware.checkCampgroundOwnership, async (req, res) => {
    try {
        let campground = await Campground.findById(req.params.id);
        //Delete any comments tied to the campground
        campground.comments.forEach(async (comment) => {
            try {
                await Comment.findByIdAndRemove(comment._id)
            } catch (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
        });
        //Delete image from cloudinary server
        await cloudinary.destroy(campground.imageId);

        campground.remove();
        req.flash('success', 'Campground removed.')
        return res.redirect('/campgrounds'); 

    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('back');
    }
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;