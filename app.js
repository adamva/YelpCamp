//Requires for modules
const   express     = require('express'),
        app         = express(),
        bodyParser  = require('body-parser'),
        mongoose    = require('mongoose'),
        flash       = require('connect-flash'),
        passport    = require('passport'),
        LocalStrategy = require('passport-local'),
        methodOverride = require('method-override'),
        Campground  = require('./models/campground'),
        User        = require('./models/user'),
        Comment     = require('./models/comment'),
        seedDB      = require('./seeds');

//Requires for routes
const   commentRoutes       = require('./routes/comments'),
        campgroundRoutes    = require('./routes/campgrounds'),
        indexRoutes         = require('./routes/index');

//Environment setup
require('dotenv').config();

//Connect to database with mongoose
//The connection is with the localhost mongodb but 
//this connection string can be swapped with a cloud based DB as well
const connectionString = 'mongodb+srv://' + process.env.DB_USERNAME + ':' + process.env.DB_PASS + process.env.DB_NAME;
mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useCreateIndex: true, 
    useUnifiedTopology: true
}).then(() => {
    console.log('Conneted to DB');
}).catch(err => {
    console.log('error: ', err.message);
});

//Flash Config
app.use(flash());

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
app.use(indexRoutes);

//Express listening for connections
app.listen(process.env.PORT | 5500, process.env.IP, function () {
    console.log('Yelpcamp server has started!');
});