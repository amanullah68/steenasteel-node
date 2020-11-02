var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var logger = require('morgan');
var router = require('./routes/index');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(logger('dev'));


app.use('/', require('./routes'));

// If no route is matched by now, it must be a 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Start the server
app.set('port', process.env.PORT || 8096);
    var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + server.address().port);
});