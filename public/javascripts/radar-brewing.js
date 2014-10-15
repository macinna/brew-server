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
    regulateMt: 'off'
}


/* 
    Button Event Handlers
*/
$('#hlt_regulate_toggle').click( function() {
    var newState = currentStates.regulateHlt === 'off' ? 'on' : 'off';
    currentStates.regulateHlt = newState;
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
    socket.emit('get-temp-probe-info');
});



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


socket.on('update_toggles', function(data) {
    console.log(data);
    
    //Update HLT Burner Toggle state
    if(data.hltBurner != currentStates.hltBurner)
        toggleButtonState($('#hlt_burner_toggle'));

    //Update MT Burner Toggle state
    if(data.mtBurner != currentStates.mtBurner)
        toggleButtonState($('#mt_burner_toggle'));

    //Update HLT Regulator Toggle state
    if(data.regulateHlt != currentStates.regulateHlt)
        toggleButtonState($('#hlt_regulate_toggle'));

    //Update MT Regulator Toggle state
    if(data.regulateMt != currentStates.regulateMt)
        toggleButtonState($('#mt_regulate_toggle'));

    //Update Left Pump Toggle state
    if(data.leftPump != currentStates.leftPump)
        toggleButtonState($('#left_pump_toggle'));

    //Update MT Regulator Toggle state
    if(data.rightPump != currentStates.rightPump)
        toggleButtonState($('#right_pump_toggle'));

    currentStates = data;
});



socket.on('all-temp-probes', function(probes) {
   console.log(probes);
});


socket.on('temps', function(temps) {

    //update gauges and charts
    
    hltGaugeData.setValue(0, 1, temps.hlt);
    hltGauge.draw(hltGaugeData, gaugeOptions);

    mtGaugeData.setValue(0, 1, temps.mt);
    mtGauge.draw(mtGaugeData, gaugeOptions);

    bkGaugeData.setValue(0, 1, temps.bk);
    bkGauge.draw(bkGaugeData, gaugeOptions);


    if(hltLineData.getNumberOfRows() > 15){
        hltLineData.removeRow(0);
    }

    if(mtLineData.getNumberOfRows() > 15){
        mtLineData.removeRow(0);
    }

    if(bkLineData.getNumberOfRows() > 15){
        bkLineData.removeRow(0);
    }

    
    var currentDate = new Date();
    var time = currentDate.getHours() + ':' + (currentDate.getMinutes().length == 1 ? '0' + currentDate.getMinutes() : currentDate.getMinutes()) ;

    hltLineData.addRow([time, parseFloat(temps.hlt)]);
    hltLine.draw(hltLineData, lineChartOptions);

    mtLineData.addRow([time, parseFloat(temps.mt)]);
    mtLine.draw(hltLineData, lineChartOptions);

    bkLineData.addRow([time, parseFloat(temps.bk)]);
    bkLine.draw(bkLineData, lineChartOptions);

});

$(document).ready(function() {
   
});































