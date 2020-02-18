const mongoose = require('mongoose');

//Schema setup
//Blueprint of what a data entry for a new campground should look like
const campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now},
    author: {
        //When associating a model to another model you need to specify the id of the associated model
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
});

//Convert the blueprint into a model the DB can use and proivde us with
//methods to use with the DB
const Campground = mongoose.model('Campground', campgroundSchema);
module.exports = Campground;