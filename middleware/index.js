const   Campground  = require('../models/campground'),
        Comment     = require('../models/comment');

//All the middleware goes here
let middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    //is user logged in?
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, (err, foundCampground) => {
            if (err || !foundCampground) {
                req.flash('error', 'Campground not found.');               
                res.redirect('back');//'back' sends you to the previous page
            //does user own campground?
            } else if(foundCampground.author.id.equals(req.user._id)){//.equals is because .id is an object while ._id is a string
                next();
            } else {
                req.flash('error', 'Permission denied.'); 
                res.redirect('back');
            }
        }); 
    } else {
        req.flash('error', 'You need to be logged in to do that.');
        res.redirect('back');
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
    //is user logged in?
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err || !foundComment) {       
                req.flash('error', 'Comment not found');        
                res.redirect('back');
            } else {
                //does user own comment?
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash('error', 'Permission denied.'); 
                    res.redirect('back');
                }                   
            }
        }); 
    } else {
        req.flash('error', 'You need to be logged in to do that.'); 
        res.redirect('/back');
    }
};

middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    } else {
        req.flash('error', 'You need to be logged in to do that.');
        res.redirect('/login');
    }
};

module.exports = middlewareObj;