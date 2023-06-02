//imports
const express = require('express'); //js server
const socket  = require('socket.io'); //websockets

//express setup
const PORT = process.env.port || 4000;
const app = express();
const server = app.listen(PORT,function(){
  console.log(`Escoltant peticions a localhost:${PORT}`);
});

//serve static files
app.use(express.static('public'));

//create new server socket
const io = socket(server);

/*setup finished*/

//llista usuaris (sock.ids i nom)
let usuaris=[];

//SERVER SOCKET: ESCOLTA CLIENT EVENTS
io.on('connection',function(sock){
  console.log(`nova connexió ${sock.id}`);

  sock.on('disconnect',function(){
    console.log(`disconnected ${sock.id}`);
    io.emit("refresh_usuaris",usuaris);
  });

  //client anuncia canvi url
  sock.on('set_name',function(new_name){
    console.log(`set_name: ${new_name} ${sock.id}`);
    usuaris.push(new Usuari(new_name,sock));
  });

});
