const cloudinary = require('cloudinary');
cloud = {}

cloudinary.config({ 
    cloud_name: 'adamva-personal-projects', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

cloud.uploads = function(file, folder){
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(file, {resource_type: 'auto', folder: folder})
        .then((result) => {
            resolve(
                {
                    url: result.url,
                    publicId: result.public_id
                })
        }).catch((error) => {
            console.log(error);
            reject(error);
        })
    })
}

cloud.destroy = function(file){
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.destroy(file)
        .then(resolve)
        .catch((error) => {
            reject(error);
        })
    })
}

module.exports = cloud