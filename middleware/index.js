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
            } else if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                //.equals is because .id is an object while ._id is a string
                return next();
            } else {
                req.flash('error', 'Permission denied.'); 
                return res.redirect('back');
            }
        }); 
    } else {
        req.flash('error', 'You need to be logged in to do that.');
        return res.redirect('back');
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
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    return next();
                } else {
                    req.flash('error', 'Permission denied.'); 
                    return res.redirect('back');
                }                   
            }
        }); 
    } else {
        req.flash('error', 'You need to be logged in to do that.'); 
        return res.redirect('/back');
    }
};

middlewareObj.isProduction = function(req, res, next){
    if(process.env.CUR_ENV !== 'local'){
        req.flash('error', 'Sorry, that feature has been disabled.');
        return res.redirect('back');
    } else {
        return next();
    }
};

middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    } else {
        req.flash('error', 'You need to be logged in to do that.');
        return res.redirect('/login');
    }
};

module.exports = middlewareObj;