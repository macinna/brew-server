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

const ON = 1;
const OFF = 0;

const HLT_BURNER_PIN = 17;
const MT_BURNER_PIN = 17;
const LEFT_PUMP_PIN = 17;
const RIGHT_PUMP_PIN = 17;


var currentStates = {
    hltBurner: 'off',
    mtBurner: 'off',
    leftPump: 'off',
    rightPump: 'off',
    regulateHlt: 'off',
    regulateMt: 'off'
};


module.exports = {
    setBurnerState: function (burner, state) {
      
        var newPinState = state == 'on' ? ON : OFF;
        var pin;
        
        if(burner == 'hlt') {
            pin = HLT_BURNER_PIN;
            currentStates.hltBurner = state;
        }

        if (burner == 'mt') {
            pin = MT_BURNER_PIN;
            currentStates.mtBurner = state;
        }

        wpi.digitalWrite(pin, newPinState);

    },
    getBurnerState: function(burner) {
        if(burner == 'hlt')
            return currentStates.hltBurner;
        
        if(burner == 'mt')
            return currentStates.mtBurner;
      
    },
    setPumpState: function (pump, state) {
        var newPinState = state == 'on' ? ON : OFF;
        var pin;
        
        if(pump == 'left') {
            pin = LEFT_PUMP_PIN;
            currentStates.leftPump = state;
        }

        if (pump == 'right') {
            pin = RIGHT_PUMP_PIN;
            currentStates.rightPump = state;
        }

        wpi.digitalWrite(pin, newPinState);
    
    
    
    },
    getPumpState: function(pump) {
        if(pump == 'left')
            return currentStates.leftPump;
        
        if(pump == 'right')
            return currentStates.rightPump;
    
    
      
    },
    getRegulateTemperatureState: function(vessel) {
        if(vessel == 'hlt')
            return currentStates.regulateHlt;
        
        if(vessel == 'mt')
            return currentStates.regulateMt;

    },
    regulateTemperature: function(vessel, state) {

        if(vessel == 'hlt')
            currentStates.regulateHlt = state;
        
        if(vessel == 'mt')
            currentStates.regulateMt = state;

    
    }
};

function getPinStatus(pin) {
    
}

function setPinStatus(pin, status) {
    
}