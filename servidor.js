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

/*app start below*/

//llista usuaris
let usuaris=[];
class Usuari{
  constructor(nom,sock_id){
    this.nom     = nom;
    this.sock_id = sock_id;
  }
}

//SERVER SOCKET: ESCOLTA CLIENT EVENTS
io.on('connection',function(sock){
  console.log(`nou usuari anònim: ${sock.id}`);

  sock.on('disconnect',function(){
    console.log(`desconnectat: ${sock.id}`);
    let usr = usuaris.find(u=>u.sock_id==sock.id);
    if(!usr) return;

    let nom = usr.nom;
    let index = usuaris.indexOf(usr);
    usuaris.splice(index,1);
    io.emit('refresca_usuaris',usuaris);

    //emet nou missatge a tothom
    io.emit('missatge',{
      sock_id:"server",
      missatge:`"${nom}" has disconnected`,
      data:(new Date()).toString(),
      color:"red",
    });
  });

  //remote user entra al xat
  sock.on('nom_usuari',function(nou_nom){
    //nom_usuari: string
    console.log(`${sock.id} és ${nou_nom}`);

    //si l'usuari ja estava connectat canvia-li el nom
    let usr = usuaris.find(u=>u.sock_id==sock.id);

    if(usr){
      let antic_nom = usr.nom;

      //si antic==nou no facis res
      if(nou_nom==antic_nom){return;}

      //canvia el nom
      usr.nom = nou_nom;
    }else{
      //si l'usuari no estava registrat registra'l
      usuaris.push(new Usuari(nou_nom, sock.id));

      //emet nou missatge a tothom
      io.emit('missatge',{
        sock_id:"server",
        missatge:`"${nou_nom}" just entered the chat`,
        data:(new Date()).toString(),
      });
    }

    //emet la nova llista d'usuaris
    io.emit('refresca_usuaris',usuaris);

    //emet el nom al client
    sock.emit("nom_usuari",nou_nom);
  });

  //remote user està escrivint missatge
  sock.on('typing',function(){
    io.emit('typing',sock.id);
  });

  //missatge rebut del client
  sock.on('missatge',function(missatge){
    //missatge: string
    console.log(`${sock.id} says: "${missatge}"`);

    //emet nou missatge a tothom
    io.emit('missatge',{
      sock_id:sock.id,
      missatge,
      data:(new Date()).toString(),
    });
  });
});
