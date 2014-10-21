google.load("visualization", "1", {packages:["gauge", "corechart"]});
google.setOnLoadCallback(initCharts);


var socket = io.connect('/');


var gaugeOptions = {
    width: 400, height: 120,
    redFrom: 90, redTo: 100,
    yellowFrom:75, yellowTo: 90,
    minorTicks: 5,
    width:200,
    height:200
};


var lineChartOptions = {
    vAxis: {minValue:50, maxValue:220},
    curveType: 'function',
    legend: {position: 'none'},
    animation: {
        duration: 500,
        easing: 'in'}
}

var hltGauge, hltLine, mtGauge, mtLine, bkGauge, bkLine;
var hltGaugeData, mtGaugeData, hltLineData, mtLineData, bkGaugeData, bkLineData;

function initCharts() {

    //draw initial guages
    hltGaugeData = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['HLT', 0]
    ]);


    mtGaugeData = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['MT', 0]
    ]);

    bkGaugeData = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['BK', 0]
    ]);

    hltGauge = new google.visualization.Gauge(document.getElementById('hlt_gauge_div'));
    hltGauge.draw(hltGaugeData, gaugeOptions);
    
    mtGauge = new google.visualization.Gauge(document.getElementById('mt_gauge_div'));
    mtGauge.draw(mtGaugeData, gaugeOptions);

    bkGauge = new google.visualization.Gauge(document.getElementById('bk_gauge_div'));
    bkGauge.draw(bkGaugeData, gaugeOptions);

    //draw initial line charts
    hltLine = new google.visualization.LineChart(document.getElementById('hlt_line_div'));
    
    hltLineData = new google.visualization.DataTable();
    hltLineData.addColumn('string', 'Time');
    hltLineData.addColumn('number', 'Temperature');
    hltLine.draw(hltLineData, lineChartOptions);


    mtLine = new google.visualization.LineChart(document.getElementById('mt_line_div'));
    
    mtLineData = new google.visualization.DataTable();
    mtLineData.addColumn('string', 'Time');
    mtLineData.addColumn('number', 'Temperature');
    mtLine.draw(mtLineData, lineChartOptions);

    bkLine = new google.visualization.LineChart(document.getElementById('bk_line_div'));
    
    bkLineData = new google.visualization.DataTable();
    bkLineData.addColumn('string', 'Time');
    bkLineData.addColumn('number', 'Temperature');
    bkLine.draw(bkLineData, lineChartOptions);

}


//Initialize current button states
var currentStates = {
    hltBurner: 'off',
    mtBurner: 'off',
    leftPump: 'off',
    rightPump: 'off',
    regulateHlt: 'off',
    regulateMt: 'off',
    hltSetPoint: '',
    mtSetPoint: ''
}


/* 
    Button Event Handlers
*/
$('#hlt_regulate_toggle').click( function() {
    var newState = currentStates.regulateHlt === 'off' ? 'on' : 'off';
    currentStates.regulateHlt = newState;

    //if we're regulating a temp, the burner cannot be manually controlled, nor can they change the set point value
    $('#hlt_set_point').prop('disabled', newState == 'on');
    $('#reg_hlt_spinner').toggleClass('fa-spin', newState == 'on');

    socket.emit('regulate-temp-clicked', {
            vessel: 'hlt',
            newState: newState,
            setPoint: $('#hlt_set_point').val()
        }
    );
    toggleButtonState(this);
});


$('#mt_regulate_toggle').click( function() {
    var newState = currentStates.regulateMt === 'off' ? 'on' : 'off';
    currentStates.regulateMt = newState;

    //if we're regulating a temp, the burner cannot be manually controlled, nor can they change the set point value
    $('#mt_set_point').prop('disabled', newState == 'on');
    $('#reg_mt_spinner').toggleClass('fa-spin', newState == 'on');

    socket.emit('regulate-temp-clicked', {
            vessel: 'mt',
            newState: newState,
            setPoint: $('#mt_set_point').val()
        }
    );
    toggleButtonState(this);
});


$('#hlt_burner_toggle').click( function() {
    var newState = currentStates.hltBurner === 'off' ? 'on' : 'off';
    currentStates.hltBurner = newState;

    $('#burner_hlt_spinner').toggleClass('fa-spin', newState == 'on');

    socket.emit('toggle-burner-clicked', {
            burner: 'hlt',
            newState: newState
        }
    );
    toggleButtonState(this);
});



$('#mt_burner_toggle').click( function() {
    var newState = currentStates.mtBurner === 'off' ? 'on' : 'off';
    currentStates.mtBurner = newState;

    $('#burner_mt_spinner').toggleClass('fa-spin', newState == 'on');

    socket.emit('toggle-burner-clicked', {
            burner: 'mt',
            newState: newState
        }
    );
    toggleButtonState(this);
});

$('#left_pump_toggle').click( function() {
    var newState = currentStates.leftPump === 'off' ? 'on' : 'off';
    currentStates.leftPump = newState;
    socket.emit('toggle-pump-clicked', {
            pump: 'left',
            newState: newState
        }
    );
    toggleButtonState(this);
});

$('#right_pump_toggle').click( function() {
    var newState = currentStates.rightPump === 'off' ? 'on' : 'off';
    currentStates.rightPump = newState;
    socket.emit('toggle-pump-clicked', {
            pump: 'right',
            newState: newState
        }
    );
    toggleButtonState(this);
});


$('#configure').click( function() {
    //remove any messages still lingering from previous time
    $('#config-save-success').toggleClass('show', false);
    $('#config-save-success').toggleClass('hidden', true);

    $('#config-save-error').toggleClass('show', false);
    $('#config-save-error').toggleClass('hidden', true);

    $('#validation-not-unique-error').toggleClass('show', false);
    $('#validation-not-unique-error').toggleClass('hidden', true);


    socket.emit('get-temp-probe-info');
});

$('#save-configuration').click( function() {

    var hltProbeDd = $('#hltTempProbe');
    var mtProbeDd = $('#mtTempProbe');
    var bkProbeDd = $('#bkTempProbe');

    //validate probe selections. they must be unique or blank.
    var showValidationError = false;

    if(hltProbeDd.val() != '') {
        if(hltProbeDd.val() == mtProbeDd.val() || hltProbeDd.val() == bkProbeDd.val() )
            showValidationError = true;
    } else if (mtProbeDd.val() != '') {
        if(mtProbeDd.val() == hltProbeDd.val() || mtProbeDd.val() == bkProbeDd.val() )
            showValidationError = true;
    } else if (bkProbeDd.val() != '') {
        if(bkProbeDd.val() == hltProbeDd.val() || bkProbeDd.val() == mtProbeDd.val() )
            showValidationError = true;
    }

    if( showValidationError) {
        $('#validation-not-unique-error').toggleClass('show hidden');
        return;
    }

    var data = {
        selectedTempProbes: {
            hlt: hltProbeDd.val(),
            mt: mtProbeDd.val(),
            bk: bkProbeDd.val()
        }
    };

    socket.emit('save-config-data', data);
});


/*
    Socket.io event handlers
 */
socket.on('save-configuration-status', function(data) {
    if(data.status === 'success') {
        $('#config-save-success').toggleClass('hidden show');
    } else {
        $('#config-save-error').toggleClass('hidden show');
    }

});

socket.on('temp-probe-data', function(probes) {
    updateOptionsList(probes, 'hlt', $('#hltTempProbe'));
    updateOptionsList(probes, 'mt', $('#mtTempProbe'));
    updateOptionsList(probes, 'bk', $('#bkTempProbe'));
});


socket.on('update_toggles', function(data) {
    console.log(data);
    
    //Update HLT Burner Toggle state
    if(data.hltBurner != currentStates.hltBurner) {
        $('#burner_hlt_spinner').toggleClass('fa-spin', data.hltBurner == 'on');
        toggleButtonState($('#hlt_burner_toggle'));
    }

    //Update MT Burner Toggle state
    if(data.mtBurner != currentStates.mtBurner) {
        $('#burner_mt_spinner').toggleClass('fa-spin', data.mtBurner == 'on');
        toggleButtonState($('#mt_burner_toggle'));
    }

    //Update HLT Regulator Toggle state
    if(data.regulateHlt != currentStates.regulateHlt) {
        //if we're regulating a temp, the burner cannot be manually controlled, nor can they change the set point value
        $('#hlt_set_point').prop('disabled', data.regulateHlt == 'on');
        $('#reg_hlt_spinner').toggleClass('fa-spin', data.regulateHlt == 'on');
        toggleButtonState($('#hlt_regulate_toggle'));
    }

    //Update MT Regulator Toggle state
    if(data.regulateMt != currentStates.regulateMt) {
        //if we're regulating a temp, the burner cannot be manually controlled, nor can they change the set point value
        $('#mt_set_point').prop('disabled', data.regulateMt == 'on');
        $('#reg_mt_spinner').toggleClass('fa-spin', data.regulateMt == 'on');
        toggleButtonState($('#mt_regulate_toggle'));
    }

    //Update Left Pump Toggle state
    if(data.leftPump != currentStates.leftPump)
        toggleButtonState($('#left_pump_toggle'));

    //Update MT Regulator Toggle state
    if(data.rightPump != currentStates.rightPump)
        toggleButtonState($('#right_pump_toggle'));

    //Update the HLT set point
    if(data.hltSetPoint != currentStates.hltSetPoint)
        $('#hlt_set_point').val(data.hltSetPoint);

    //Update the MT set point
    if(data.mtSetPoint != currentStates.mtSetPoint)
        $('#mt_set_point').val(data.mtSetPoint);



    currentStates = data;
});

var probeTemperatures = new Array();

socket.on('temperature', function(temps) {
    console.log(temps);


    //populating our associative array with data that is used in vessel->probe configuration
    probeTemperatures[temps.probeId] = {
        vessel: temps.vessel,
        temperature: temps.temperature
    };


    //if we're here before our gauges have been drawn, or if this is a temp record for an unassociated probe, we exit
    //since there is no UI to update
    if(hltGauge == undefined || temps.vessel == undefined)
        return;

    var gaugeData, gaugeChart, lineData, lineChart;

    if(temps.vessel == 'hlt') {
        gaugeData = hltGaugeData;
        gaugeChart = hltGauge;
        lineData = hltLineData;
        lineChart = hltLine;
    }

    if(temps.vessel == 'mt') {
        gaugeData = mtGaugeData;
        gaugeChart = mtGauge;
        lineData = mtLineData;
        lineChart = mtLine;
    }

    if(temps.vessel == 'bk') {
        gaugeData = bkGaugeData;
        gaugeChart = bkGauge;
        lineData = bkLineData;
        lineChart = bkLine;
    }

    var currentDate = new Date();
    var time = currentDate.getHours() + ':' + (currentDate.getMinutes().length == 1 ? '0' + currentDate.getMinutes() : currentDate.getMinutes()) ;

    gaugeData.setValue(0, 1, temps.temperature);
    gaugeChart.draw(gaugeData, gaugeOptions);

    if(lineData.getNumberOfRows() > 15){
        lineData.removeRow(0);
    }

    lineData.addRow([time, parseFloat(temps.temperature)]);
    lineChart.draw(lineData, lineChartOptions);
});

function updateOptionsList(probeData, vessel, element) {

    element.empty();
    var options = '<option value="">Select a Temperature Probe</option>';
    for( var i = 0; i < probeData.allAttachedProbes.length; i++) {
        var selected = '';
        if(probeData.allAttachedProbes[i] === probeData.probeMap[vessel]) {
            selected = ' selected ';
        }
        options += '<option value="' + probeData.allAttachedProbes[i] + '"' + 'name="' + probeData.allAttachedProbes[i] + '-temp"' + selected + '>' + probeData.allAttachedProbes[i] + '</option>';
        setOptionTemperature(probeData.allAttachedProbes[i]);
    }

    element.append(options);

}


function setOptionTemperature(probeId) {

    var optionElements = document.getElementsByName(probeId + '-temp');
    
    if(optionElements == null || optionElements.length == 0)
        return;

    for(var i = 0; i < optionElements.length; i++) {
        optionElements[i].innerHTML = probeId + '&nbsp;&nbsp;&nbsp;&nbsp;(' + probeTemperatures[probeId].temperature + ' °F)';
    }

    setInterval( function() {
        setOptionTemperature(probeId);
    }, 2000);
}



function toggleButtonState(buttonGroup) {
    $(buttonGroup).find('.btn').toggleClass('active');

    if ($(buttonGroup).find('.btn-primary').size()>0) {
        $(buttonGroup).find('.btn').toggleClass('btn-primary');
    }
    if ($(buttonGroup).find('.btn-danger').size()>0) {
        $(buttonGroup).find('.btn').toggleClass('btn-danger');
    }
    if ($(buttonGroup).find('.btn-success').size()>0) {
        $(buttonGroup).find('.btn').toggleClass('btn-success');
    }
    if ($(buttonGroup).find('.btn-info').size()>0) {
        $(buttonGroup).find('.btn').toggleClass('btn-info');
    }

    $(buttonGroup).find('.btn').toggleClass('btn-default');
}


$(document).ready(function() {

});































