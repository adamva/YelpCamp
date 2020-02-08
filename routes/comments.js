const   express     = require('express'),
        Campground  = require('../models/campground'),
        Comment     = require('../models/comment'),
        middleware  = require('../middleware');

const router = express.Router({mergeParams: true}); //this merges the params of campgrounds with comments ie if you're getting a 'cant read property' error, specify {mergreParams: true}

//Notice that in both get and post routes isLoggedIn is called. isLoggedIn acts as a middleware to prevent anyone who is not logged in from making comments

//Comments new
router.get('/new', middleware.isLoggedIn, (req, res) => {
    //Find campground by ID
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (err || !foundCampground) {
            req.flash('error', 'Campground not found');
            res.redirect('back');
        } else {
            res.render('comments/new', {campground: foundCampground});
        }
    });    
});

//Comments create
router.post('/', middleware.isLoggedIn, (req, res) => {
    //Lookup campground using ID
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (err || !foundCampground) {
            req.flash('error', 'Campground not found.');
            res.redirect('back');
        } else {
            //Create new comment
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    req.flash('error', 'Something went wrong.');
                    console.log(err.message);
                    res.redirect('back')
                } else {
                    //associate comment to user
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();

                    foundCampground.comments.push(comment);
                    foundCampground.save();
                    req.flash('success', 'Successfully added comment.'); 
                    res.redirect('/campgrounds/' + foundCampground._id);
                }
            })
        }
    });    
});

//Comments edit
router.get('/:comment_id/edit', middleware.checkCommentOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (err || !foundCampground) {
            req.flash('error', 'Campground not found.');
            return res.redirect('back');
        } else {
            Comment.findById(req.params.comment_id, (err, foundComment) => {
                if (err) {
                    req.flash('error', 'Something went wrong.');
                    console.log(err.message);
                    res.redirect('back');
                } else {
                    res.render('comments/edit', {campground_id: req.params.id, comment: foundComment});
                }
            });
        }
    });        
});

//Comments update
router.put('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
        if (err) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            res.redirect('back');
        } else {
            res.redirect('/campgrounds/' + req.params.id);
        }
    });
});

//Comment destroy
router.delete('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err, foundComment) => {
        if (err || !foundComment) {
            req.flash('error', 'Something went wrong.');
            console.log(err.message);
            res.redirect('back');
        } else {
            req.flash('success', 'Comment deleted.'); 
            res.redirect('/campgrounds/' + req.params.id);
        }
    });
});

module.exports = router;