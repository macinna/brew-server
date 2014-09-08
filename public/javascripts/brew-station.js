var socket = io.connect('/');
socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
});

socket.on('temps', function(data){
    console.log(data);
    $("#temperature").html(data.hlt);    
});


$("#hlt").click(function() {
    socket.emit('hlt-switch-clicked', $("#hlt").is(':checked'))
    

    console.log( "You clicked the switch." );
});

