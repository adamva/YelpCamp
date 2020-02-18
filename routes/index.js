const express = require('express');
const router = express.Router();

//Root route
router.get('/', function (req, res) {
    return res.render('landing');
});

//Error - Page could not be found
router.get('*', function (req, res) { 
    return res.send('page not found');
});

module.exports = router;