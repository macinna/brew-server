var express = require('express');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var debug = require('debug')('brew-server');

var fs = require('fs');

var app = express();

var wpi = require('wiring-pi');
var exec = require('child_process').exec;

//set up pi pins for export and output
//by exporting the pins, we can use witout being root
var child = exec('gpio export 17 out',
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});

wpi.wiringPiSetupSys();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86000000 }));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});


var io = require('socket.io')(server);
var regulatorHandle;
var temp = 100;
var relayOn = true;

var init = false;

io.on('connection', function (socket) {

    if(init == false)
    {
        setInterval(updateTemperatures, 2000);
        init = true;
    }

    socket.on('hlt-switch-clicked', function (switchIsOn) {
        debug(switchIsOn);
        if( switchIsOn == true ){
            //switch turned on
            regulatorHandle = setInterval(regulateHlt, 1000);
        }
        else {
            wpi.digitalWrite(17, 1);
            clearInterval(regulatorHandle);    
        }

    });
});

function regulateHlt(){
    debug('Output pin set to ' + relayOn);
    wpi.digitalWrite(17, relayOn===true ? 0 : 1);
    relayOn = !relayOn;

}

function updateTemperatures(){
  fs.readFile('/mnt/1wire/28.23A6E4050000/temperature9', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  
  var degF = data * (9.0/5.0) + 32;
  
  degF = Math.round(degF * 10) / 10;
  
  io.sockets.emit('temps', {
      hlt: degF,
      mt: degF,
      bk: degF
  });
});
}



