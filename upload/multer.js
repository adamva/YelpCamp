const multer = require('multer');

//Remame images to unique
const storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

//Filter any none image files
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Hey! Thats not an image that I support.'), false);
    }
    cb(null, true);
};

const upload = multer(
    { 
        storage: storage, 
        fileFilter: imageFilter, 
        limits: {fileSize: 1024*1024}
    }
).single('image');

let parse = {}

parse.single = function(req, res, next){
    upload(req, res, (err) => {
        if(err){
            req.flash('error', err.message)
            return res.redirect('back')
        } else {
            next()
        }
    })
}

module.exports = parse;