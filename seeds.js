const   Campground  = require('./models/campground'),
        Comment     = require('./models/comment'),
        User        = require('./models/user')
        seeds       = require('./seedData'),
        NodeGeocoder = require('node-geocoder');
 
const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
const geocoder = NodeGeocoder(options);
async function seedDB() {
    try {
        //Wait for pre-existing comments, camgrounds, and dummy user to be deleted from DB
        await Comment.deleteMany({});
        await Campground.deleteMany({});
        await User.deleteMany({});
        console.log('Removed campgrounds, comments and users');

        //Add new seeds to DB
        let seedUser = new User({
            username: 'Oryx',
            avatar: 'https://images.unsplash.com/photo-1489693755295-4a1efc9e7f72?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80',
            firstName: 'Taken',
            lastName: 'King',
            email: 'oryx.taken.king.services@gmail.com', 
            isAdmin: true
        });
        
        await User.register(seedUser, 'password');
        console.log('User: \'' + seedUser.username + '\' created');
        
        let author = {id: seedUser._id, username: seedUser.username};
        for(const seed of seeds) {
            let name = seed.name;
            let price = seed.price;
            let image = seed.image;
            let desc = seed.description;

            let data = await geocoder.geocode(seed.location)
            let lat = data[0].latitude;
            let lng = data[0].longitude;
            let location = data[0].formattedAddress;

            let newCampground = {name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng};
            let newComment = {text: seed.comment, author: author}

            let campground = await Campground.create(newCampground);
            let comment = await Comment.create(newComment);
            campground.comments.push(comment);
            campground.save();
            console.log('Campground: ' + name + ' added to DB');
            
        }
    } catch(err){
        console.log(err.message);
    }    
}

module.exports = seedDB;