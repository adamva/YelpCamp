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

geocode.geocode = function(location, callback){
    instance.request({
        params: {
            address: location,
            key: process.env.GEOCODER_API_KEY
        }
    }).then((response) => {
        callback(response.data.results);

    }).catch((error) => {
        if (error.response) {
            console.log('Error: Google responsed with status code outside of 200');
            console.log(error.response.data);
        } else if(error.request){
            console.log('Error: No response');
            console.log(error.request);
        } else{
            console.log('Error', error.message);
        }
        console.log('Config of request');
        console.log(error.config);
    });
}

geocode.geocode2 = function(location){
    return new Promise((resolve, reject) => {
        instance.request({
            params: {
                address: location,
                key: process.env.GEOCODER_API_KEY
            }
        }).then((response) => {
            resolve(response.data.results);
        }).catch((error) => {
            console.log(error.error_message);
            reject;
        })
    })
}

module.exports = geocode;