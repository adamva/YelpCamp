// Environment setup
try{
    require('dotenv').config();
} catch(err){
    console.log('error: ' + err);
}

//Requires for modules
const   express     = require('express'),
        app         = express(),
        bodyParser  = require('body-parser'),
        mongoose    = require('mongoose'),
        flash       = require('connect-flash'),
        passport    = require('passport'),
        LocalStrategy = require('passport-local'),
        methodOverride = require('method-override'),
        User        = require('./models/user');

//Requires for routes
const   commentRoutes       = require('./routes/comments'),
        campgroundRoutes    = require('./routes/campgrounds'),
        userRoutes          = require('./routes/user'),
        passwordRoutes      = require('./routes/password'),
        indexRoutes         = require('./routes/index');

const connectionString = process.env.DB_URL;

mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useCreateIndex: true, 
    useUnifiedTopology: true
}).then(() => {
    console.log('Conneted to DB');
}).catch(err => {
    console.log('DB connection error: ', err.message);
});

//Flash Config
app.use(flash());

//Moment Config (Its for posting times for new campgrounds, comments, etc.)
app.locals.moment = require('moment');

//Passport Config
app.use(require('express-session')({
    secret: 'This is my first website with Colt Steele\'s WebDev Bootcamp',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Other Configs
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));

//Clear database and seed with new data
// const seedDB = require('./seed');
// seedDB();

//This is a middleware for EVERY route
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

//ORDER MATTERS WHEN app.use() ROUTES
app.use('/campgrounds', campgroundRoutes); //'/campgrounds' is a prefix that can be appened to the routes in campgroundsRoutes
app.use('/campgrounds/:id/comments', commentRoutes);
app.use(passwordRoutes);
app.use(userRoutes);
app.use(indexRoutes);

//Express listening for connections
app.listen(process.env.PORT || 5500, process.env.IP, function () {
    console.log('Yelpcamp server has started!');
});