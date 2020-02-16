const express = require('express');
const router = express.Router();

//Root route
router.get('/', function (req, res) {
    res.render('landing');
});

//Error - Page could not be found
router.get('*', function (req, res) { 
    res.send('page not found');
});

module.exports = router;