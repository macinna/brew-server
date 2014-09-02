var socket = io.connect('/');
socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
});


$("#hlt").click(function() {
    socket.emit('hlt-switch-clicked', $("#hlt").is(':checked'))
    

    console.log( "You clicked the switch." );
});
