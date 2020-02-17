const axios = require('axios');

let geocode = {}

const instance = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api/geocode/json',
    timeout: 3000,
    proxy:{
        host: process.env.QUOTAGUARDSTATIC_IP,
        port: process.env.QUOTAGUARDSTATIC_PORT,
        auth:{
            username: process.env.QUOTAGUARDSTATIC_UN,
            password: process.env.QUOTAGUARDSTATIC_PW
        }
    }
});

geocode.geocode = function(location, next){
    instance.request({
        params: {
            address: location,
            key: process.env.GEOCODER_API_KEY
        }
    }).then((response) => {
        next(response.data.results);

    }).catch((error) => {
        if (error.response) {
            console.log('Error: Google responsed with status code outside of 200');
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else if(error.request){
            console.log('Error: No response');
            console.log(error.request);
        } else{
            console.log('Error', error.message);
        }
        console.log(error.config);
    });
}

module.exports = geocode;