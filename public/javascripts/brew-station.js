

google.load("visualization", "1", {packages:["gauge", "corechart"]});
google.setOnLoadCallback(initCharts);

var gaugeOptions = {
    width: 400, height: 120,
    redFrom: 90, redTo: 100,
    yellowFrom:75, yellowTo: 90,
    minorTicks: 5,
    width:200,
    height:200
};


var lineChartOptions = {
    vAxis: {minValue:0, maxValue:100},
    curveType: 'function',
    legend: {position: 'none'},
    animation: {
        duration: 500,
        easing: 'in'},
    theme: 'maximized'
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
    hltLine.draw(mtLineData, lineChartOptions);

    bkLine = new google.visualization.LineChart(document.getElementById('bk_line_div'));
    
    bkLineData = new google.visualization.DataTable();
    bkLineData.addColumn('string', 'Time');
    bkLineData.addColumn('number', 'Temperature');
    bkLine.draw(bkLineData, lineChartOptions);


}


var socket = io.connect('/');

socket.on('temps', function(temps){
    console.log(temps);

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
    console.log(time + ':' + temps.hlt);

    hltLineData.addRow([time, parseFloat(temps.hlt)]);
    hltLine.draw(hltLineData, lineChartOptions);

    mtLineData.addRow([time, parseFloat(temps.mt)]);
    mtLine.draw(hltLineData, lineChartOptions);

    bkLineData.addRow([time, parseFloat(temps.bk)]);
    bkLine.draw(bkLineData, lineChartOptions);

});

$("#regulate_hlt").click(function() {
    socket.emit('hlt-switch-clicked', $("#regulate_hlt").is(':checked'))
});

$("#regulate_mt").click(function() {
    socket.emit('mt-switch-clicked', $("#regulate_mt").is(':checked'))
});

