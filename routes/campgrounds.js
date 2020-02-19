const   express     = require('express'),
        Campground  = require('../models/campground'),
        Comment     = require('../models/comment'),
        middleware  = require('../middleware'),
        geocode     = require('../middleware/geocoder'),
        multer      = require('multer'),
        cloudinary  = require('cloudinary');

//Multer Config
//This is to upload images and save them with a name of date uploaded + original name
const storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFilter, limits:{fileSize: 500000}}).single('image');

//Cloudinar Config
cloudinary.config({ 
    cloud_name: 'adamva-personal-projects', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    upload(req, res, (err) => {
        if (err) {
            req.flash('error', err.message)
            return res.redirect('back');
        }
        //Upload image and save cloud address to campground.image
        cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
            if(err){
                req.flash('error', err.message)
                return res.redirect('back');
            }
            req.body.campground.image = result.secure_url;
            req.body.campground.imageId = result.public_id;
            req.body.campground.author = {id: req.user._id, username: req.user.username};
            
            //Use google API to find location of campground
            geocode.geocode(req.body.campground.location, (data) => {
                if(!data.length){
                    req.flash('error', 'Invalid address');
                    return res.redirect('back');
                }
                req.body.campground.location = data[0].formatted_address;
                req.body.campground.lat = data[0].geometry.location.lat;
                req.body.campground.lng = data[0].geometry.location.lng;
        
                Campground.create(req.body.campground, function(err, newCampground){
                    if(err || !newCampground){
                        req.flash('error', 'Opps, something went wrong.');
                        return res.redirect('back');
                    } else {
                        req.flash('success', 'Success! New campground added.')
                        return res.redirect("/campgrounds/" + newCampground.id);
                    }
                });
            });
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
router.put('/:id/', middleware.checkCampgroundOwnership, async (req, res) => {
    try {
        let campground = await Campground.findById(req.params.id);
        if (req.file){
            await upload(req, res)
            await cloudinary.v2.uploader.destroy(campground.imageId); 
            let result = await cloudinary.v2.uploader.upload(req.file.path);
            campground.image = result.secure_url;
            campground.imageId = result.public_id;  
        }
        if (campground.location !== req.body.campground.location){
            let data = await geocode.geocode2(req.body.campground.location);
            if (!data.length){
                req.flash('error', 'Invalid address');
                return res.redirect('back');
            }
            campground.lat = data[0].geometry.location.lat;
            campground.lng = data[0].geometry.location.lng;
            campground.location = data[0].formatted_address;
        }
        campground.name = req.body.campground.name;
        campground.price = req.body.campground.price;
        campground.description = req.body.campground.description;
        campground.save();
        req.flash("success","Successfully Updated!");
        return res.redirect("/campgrounds/" + campground._id);
        
    } catch (err) {
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
        await cloudinary.v2.uploader.destroy(campground.imageId);

        campground.remove();
        req.flash('success', 'Campground removed.')
        return res.redirect('/campgrounds'); 

    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('back');
    }
});

module.exports = router;