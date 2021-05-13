$(document).ready(function(){
    var socket=io();
    $('#list').animate({scrollTop:10000},800);
    socket.on('connect',function(socket){
        console.log("Connected to server");
    });
    socket.on('disconnect',(socket)=>{
        console.log("Disconnected from Server");

    });
});