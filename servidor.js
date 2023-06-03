//imports
const express = require('express'); //http server
const socket  = require('socket.io'); //websockets
const fs      = require("fs"); //filesystem read and write

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
    this.room    = "General";
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
      text:`"${nom}" has disconnected`,
      data:(new Date()).toString(),
      color:"red",
      room:usr.room,
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
      let new_usr = new Usuari(nou_nom, sock.id);
      usuaris.push(new_usr);

      //emet nou missatge a tothom
      io.emit('missatge',{
        sock_id:"server",
        text:`"${nou_nom}" just entered the chat`,
        data:(new Date()).toString(),
        room:new_usr.room,
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
    console.log(`${sock.id}@${missatge.room} says "${missatge.text}"`);

    //guardar el missatge a disc dur
    const content = `${(new Date()).toISOString()} ${sock.id} @ ${missatge.room}: "${missatge.text}"\n`
    fs.writeFile('log.txt',content,{flag:'a'},err=>{
      if(err) console.error(err);
    });

    //emet nou missatge a tothom
    io.emit('missatge',{
      sock_id:sock.id,
      room:missatge.room,
      text:missatge.text,
      data:(new Date()).toString(),
    });
  });

  sock.on("change_room",new_room=>{
    if(!new_room) return;
    let usr = usuaris.find(u=>u.sock_id==sock.id);
    if(!usr) return;
    if(usr.room==new_room) return;
    usr.room=new_room;
    console.log(`${sock.id} joins ${new_room}`);
    sock.emit("change_room",new_room); //server accepts
    io.emit('refresca_usuaris',usuaris);
  });
});
