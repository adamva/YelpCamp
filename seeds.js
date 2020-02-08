const   mongoose    = require('mongoose'),
        passport    = require('passport'),
        Campground  = require('./models/campground'),
        Comment     = require('./models/comment'),
        User        = require('./models/user')
        seeds       = require('./seedData');

async function seedDB() {
    try {
        //Wait for pre-existing comments, camgrounds, and dummy user to be deleted from DB
        await Comment.deleteMany({});
        await Campground.deleteMany({});
        await User.deleteOne({username: 'Oryx'});
        console.log('Removed campgrounds, comments and dummy user: \'Oryx\'');

        //Add new seeds to DB
        let seedUser = new User({username: 'Oryx'});
        await User.register(seedUser, 'password');
        console.log('User: \'' + seedUser.username + '\' created');
        
        let author = {id: seedUser._id, username: seedUser.username};
        let text = {text: '0/10 Would not recommend!!'};

        for(const seed of seeds) { //New kind of forEach loop
            //Wait for new campround to be created then add comments to the new campgrounds
            let campground = await Campground.create(seed);
            let comment = await Comment.create(text);
            comment.author = author;
            comment.save();

            campground.comments.push(comment);
            campground.author = author;
            campground.save();
            console.log('Campground added to DB');
        }
    } catch(err){
        console.log(err.message);
    }    
}

module.exports = seedDB;