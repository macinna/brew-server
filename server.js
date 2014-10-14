var express = require('express');
var app = express();
var root = __dirname + '/public';
var fs = require('fs');
var pi = require('./pi-helper'); 

app.use(express.static('public'));

app.get('*', function(req, res) {
    var options = { root: root }
    res.sendFile('html/index.html', options);
})

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});


var io = require('socket.io')(server);

var init = false;


io.on('connection', function (socket) {

    //Send current states to the client to set up the UI
    socket.emit('update_toggles', pi.getAllStates() );

    //Update the temperatures immediately, then set up the interval only once.  Otherwise any additional connections will kick off more.
    updateTemperatures();
    if(init === false) {
        setInterval(updateTemperatures, 5000);
        init = true;
    }
    
    //Event handler for regulating the temperature of a vessel
    socket.on('regulate-temp-clicked', function(data) {
        //start regulating the temp of the hot liquor tank
        console.log(data);
        pi.regulateTemperature(data.vessel, data.newState);
        refreshUI(socket);

    });
    
    //Event handler for toggling a burner 
    socket.on('toggle-burner-clicked', function(data) {
        console.log(data);
        pi.setBurnerState(data.burner, data.newState);
        refreshUI(socket);
    });
    
    //Event handler for toggling a pump 
    socket.on('toggle-pump-clicked', function(data) {
        console.log(data);
        pi.setPumpState(data.pump, data.newState);
        refreshUI(socket);
    });
    
    
    //Get current mapping of probes to vessels 
    socket.on('get-current-temp-probe-map', getCurrentTempProbeMap);

    //Get all attached temp probes
    socket.on('get-all-temp-probes', function(data) {
        //The 1wire file system (owfs) used by this system creates directories for each attached supported probe types.
        //The temperature probes this system supports are the 18S20 and 18B20.  These have a 
        //1wire family type ID of 10 and 28 respectively (see http://owfs.sourceforge.net/family.html).  
        //The directory names are prefixed with that ID, so we're going to search our 1wire directory
        //for subdirectories with names that start with 10. or 28.
        
        var tempProbes = []
        
        var files = fs.readdirSync('/mnt/1wire/');
        for( var i = 0; i < files.length; i++ ) {
            var family = files[i].split('.')[0];
            if( family === '10' || family === '28' ){
                tempProbes.push(files[i]);
            }
        }
        console.log(tempProbes);
        
        //Send array of all the temp probes to the client
        socket.emit('all-temp-probes', tempProbes);    

    });


});



function getAllTempProbes(socket) {
    //The 1wire file system (owfs) used by this system creates directories for each attached supported probe types.
    //The temperature probes this system supports are the 18S20 and 18B20.  These have a 
    //1wire family type ID of 10 and 28 respectively (see http://owfs.sourceforge.net/family.html).  
    //The directory names are prefixed with that ID, so we're going to search our 1wire directory
    //for subdirectories with names that start with 10. or 28.
    
    var tempProbes = []
    
    var files = fs.readdirSync('/mnt/1wire/');
    for( var i = 0; i < files.length; i++ ) {
        var family = files[i].split('.')[0];
        if( family === '10' || family === '28' ){
            tempProbes.push(files[i]);
        }
    }
    
    //Send array of all the temp probes to the client
    socket.emit('all-temp-probes', tempProbes);    

}

function getCurrentTempProbeMap(socket) {
    



}



function refreshUI(socket) {
    socket.broadcast.emit('update_toggles', pi.getAllStates());
}

function updateTemperatures() {

    fs.readFile('/mnt/1wire/28.23A6E4050000/temperature9', 'utf8', function(err, data) {
        var degF = data * (9.0/5.0) + 32;
        degF = Math.round(degF * 10) / 10;
    
        io.sockets.emit('temps', {
            hlt: degF,
            mt: degF,
            bk: degF
        });    
        
    });
}

 

































