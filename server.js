var express = require('express');
var app = express();
var root = __dirname + '/public';
var fs = require('fs');
var pi = require('./pi-helper');
var probes = require('./temperature-helper');
var nconf = require('nconf');

app.use(express.static('public'));

app.get('*', function(req, res) {
    var options = { root: root };
    res.sendFile('html/index.html', options);
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});


var io = require('socket.io')(server);

var currentStates = {
    hltBurner: 'off',
    mtBurner: 'off',
    leftPump: 'off',
    rightPump: 'off',
    regulateHlt: 'off',
    regulateMt: 'off',
    hltSetPoint: '',
    mtSetPoint: ''
};

var init = false;


io.on('connection', function (socket) {

    //Send current states to the client to set up the UI
    socket.emit('update_toggles', currentStates );

    //Update the temperatures immediately, then set up the interval only once.
    //Otherwise any additional connections will kick off more.
    updateTemperatures();
    if(init == false) {
        setInterval(updateTemperatures, 5000);
        init = true;
    }

    //Event handler for regulating the temperature of a vessel
    socket.on('regulate-temp-clicked', function(data) {
        //start regulating the temp of the hot liquor tank

        if(data.vessel == 'hlt') {
            currentStates.regulateHlt = data.newState;
            currentStates.hltSetPoint = data.setPoint;
        }
        else {
            currentStates.regulateMt = data.newState;
            currentStates.mtSetPoint = data.setPoint;
        }

        if(data.newState == 'on')
            regulateTemperature(data.vessel, data.setPoint);
        else {
            //turn off the appropriate burner
            var state = (data.vessel == 'hlt' ? currentStates.regulateHlt : currentStates.regulateMt);
            pi.setBurnerState(data.vessel, state);
        }

        refreshUI(socket);

    });
    
    //Event handler for toggling a burner 
    socket.on('toggle-burner-clicked', function(data) {

        data.burner == 'hlt' ? currentStates.hltBurner = data.newState : currentStates.mtBurner = data.newState;
        pi.setBurnerState(data.burner, data.newState);
        refreshUI(socket);
    });
    
    //Event handler for toggling a pump 
    socket.on('toggle-pump-clicked', function(data) {
        data.pump == 'left' ? currentStates.leftPump = data.newState : currentStates.rightPump = data.newState;
        pi.setPumpState(data.pump, data.newState);
        refreshUI(socket);
    });
    
    
    //Get all attached temp probes
    socket.on('get-temp-probe-info', function(data) {

        var probeData = {
            allAttachedProbes: probes.getAllAttachedTempProbes(),
            probeMap: probes.getTempProbeMap()
        };

        //Send array of all the temp probes to the client
        socket.emit('temp-probe-data', probeData);

    });


    socket.on('save-config-data', function(data) {

        probes.setTempProbeMap(data.selectedTempProbes);
        socket.emit('save-configuration-status', {
                status: 'success'
            }
        );

    });
});


function refreshUI(socket) {
    socket.broadcast.emit('update_toggles', currentStates);
}

function updateTemperatures() {

    //get all attached temp probes.
    var allProbes = probes.getAllAttachedTempProbes();

    allProbes.forEach(function (probe) {
        probes.getCurrentTemperature(probe, sendTemperature)
    });

}

function sendTemperature(vessel, temp, probeId) {

    io.sockets.emit('temperature', {
        vessel: vessel,
        temperature: temp,
        probeId: probeId
    });

}
 



const DUTY_CYCLE = 10000;  //Duty cycle for PWM in ms


var liquidPID = require('liquid-pid');


function regulateTemperature(vessel, setPoint, pidController) {

    var
        actualP = 0,
        currentTemp = 0;

    pidController = pidController || new liquidPID({
                                            temp: {
                                                ref: setPoint
                                            },
                                            Pmax: DUTY_CYCLE,

                                            Kp: 25,
                                            Ki: 1000,
                                            Kd: 9
                                       });

    currentTemp = probes.getCurrentTemperatureSync(vessel);
    actualP = pidController.calculate(currentTemp);

    console.log(new Date().toString() + ': ' + actualP + ' || vessel: ' + vessel);


    //if the time for the burner to be turned on is greater than 1s, do it
    if( actualP > 1000 ) {

        //turn on the burner for the returned amount of time
        pi.setBurnerState(vessel, 'on');

        //schedule the burner to be turned off in actualP milliseconds
        setTimeout(function() {

            // we won't quickly toggle the burner.  the delta needs to be greater than 1s before we switch
            if(DUTY_CYCLE - actualP > 1000)
                pi.setBurnerState(vessel, 'off');

            var state = (vessel == 'hlt' ? currentStates.regulateHlt : currentStates.regulateMt);
            if( state == 'on' )
                regulateTemperature(vessel, setPoint, pidController);
        }, actualP)
    }
    else {
        //since the burner was only going to be on for less than 1s, we're not going to turn it on.
        //we're going to leave it off, and schedule the next evaluation
        setTimeout(function() {
            var state = (vessel == 'hlt' ? currentStates.regulateHlt : currentStates.regulateMt);
            if( state == 'on' )
                regulateTemperature(vessel, setPoint, pidController);
        }, DUTY_CYCLE)

    }

}

























