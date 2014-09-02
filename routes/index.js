var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Brew' });
});

/* GET controls page. */
router.get('/controls', function(req, res) {
  res.render('controls', { title: 'Controls' });
});


module.exports = router;
