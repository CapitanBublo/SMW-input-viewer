/**
 * ==============================
 * FUNCIONES DE CONEXION AL JUEGO
 * ============================== 
 */

var started = false

function startTracker(){
    if(!started){
        started = true;
        connectToSocket();
    }
}

function stopTracker(){
    if(started){
        started = false;
        closeConection();
    }
}

var serverHost = "ws://localhost:8080"; //Por defecto, el puerto del WebServer del QUsb2Snes/SNI es el 8080
var socket = null;
var consoleName = null;

function setConectionText(text){
    document.getElementById("conectionStatus").innerHTML = text;
}

function connectToSocket(){
    setConectionText("Conectando...");
    socket = new WebSocket(serverHost); //Conectar al QUsb2Snes/SNI
    socket.binaryType = 'arraybuffer';

    socket.onerror = function(event) {
        closeConection();
        setConectionText("Error");
    }

    socket.onopen = lookForConsole;
}

function lookForConsole(event){
    setConectionText("Conectado, buscando dispositivo...");
    socket.send(JSON.stringify({
        Opcode: "DeviceList",
        Space: "SNES"
    }));

    socket.onmessage = connectToConsole;
}

function connectToConsole(event){
    var results = JSON.parse(event.data).Results;
    if (results.length < 1) {
        setConectionText("No hay ningun dispositivo");
        return;
    }
    consoleName = results[0];

    socket.send(JSON.stringify({ //Conexión a la consola
        Opcode : "Attach",
        Space : "SNES",
        Operands : [consoleName]
    }));
    socket.send(JSON.stringify({
        Opcode : "Info",
        Space : "SNES"
    }));
    socket.onmessage = empezarALeer; //Una vez confirmada la conexión, comenzamos a leer la memoria del juego
    setConectionText("Conectado a " + consoleName);

}

function closeConection(){  //Cerramos la conexión y reiniciamos todas las funciones
    if (socket !== null) {
        socket.onopen = function () {};
        socket.onclose = function () {};
        socket.onmessage = function () {};
        socket.onerror = function () {};
        socket.close();
        socket = null;
        setConectionText("Desconectado");
    }
    clearInterval(intervaloLectura);
}

/**
 * ======================================
 * FUNCIONES LEYENDO LA MEMORIA DEL JUEGO
 * ======================================
*/

var INICIO_MEMORIAS = 0xF50000

function leerMemoria(dir, tam, fun){ //Por algún motivo, si llamo directamente a socket.send, no puedo leer la respuesta
    socket.send(JSON.stringify({
        Opcode : "GetAddress",
        Space : "SNES",
        Operands : [dir.toString(16), tam.toString(16)]
    }));

    socket.onmessage = fun;
}

var datos = new Uint8Array();

function leer(){  //Así que encapsulo socket.send en otra función, y con esto si que puedo leer la respuesta??? No entiendo JS
    leerMemoria(INICIO_MEMORIAS + 0x15, 0x04, function(event){ //Shoutouts a Stack Overflow
        var datos = new Uint8Array(event.data);
        actualizaDatos(datos);
    });
}


function actualizaDatos(datos){
    var a, b, y, x, up, down, left, right, start, select, l, r; //Booleanas, indican si el boton se pulsa o no
    var byetUDLR = datos[0]; //Dirección 0x7E0015
    var axlr = datos[2]; //Direccion 0x7E0017
    
    //Operaciones bitwise entre las direcciones de memoria y sus posibles valores
    //Asi se comprueba cada boton por separado
    if((byetUDLR & 0x1) == 0x1){
        right = true;
    }
    else{
        right = false;
    }
    if((byetUDLR & 0x2) == 0x2){
        left = true;
    }
    else{
        left = false;
    }
    if((byetUDLR & 0x4) == 0x4){
        down = true;
    }
    else{
        down = false;
    }
    if((byetUDLR & 0x8) == 0x8){
        up = true;
    }
    else{
        up = false;
    }
    if((byetUDLR & 0x10) == 0x10){
        start = true;
    }
    else{
        start = false;
    }
    if((byetUDLR & 0x20) == 0x20){
        select = true;
    }
    else{
        select = false
    }
    if((axlr & 0x10) == 0x10){
        r = true;
    }
    else{
        r = false;
    }
    if((axlr & 0x20) == 0x20){
        l = true;
    }
    else{
        l = false;
    }
    setBotones(a, b, y, x, up, down, left, right, start, select, l, r);
}

function empezarALeer(){
    intervaloLectura = setInterval(leer, 15);
}

/**
 * ACTUALIZACION TRACKING DE BOTONES
 */

//Así como primera prueba, sale todo como texto
//En el futuro, cada variable determina una imagen, por ejemplo
function setBotones(a, b, y, x, up, down, left, right, start, select, l, r){
    let texto = "";
    if(a){
        texto += "A - ";
    }
    else{
        texto += "No A - ";
    }
    if(b){
        texto += "B - ";
    }
    else{
        texto += "No B - ";
    }
    if(y){
        texto += "Y - ";
    }
    else{
        texto += "No Y - ";
    }
    if(x){
        texto += "X - ";
    }
    else{
        texto += "No X - ";
    }
    if(r){
        texto += "R - ";
    }
    else{
        texto += "No R - ";
    }
    if(l){
        texto += "L - ";
    }
    else{
        texto += "No L - ";
    }
    if(up){
        texto += "Up - ";
    }
    else{
        texto += "No Up - ";
    }
    if(down){
        texto += "Down - ";
    }
    else{
        texto += "No Down - ";
    }
    if(left){
        texto += "Left - ";
    }
    else{
        texto += "No Left - ";
    }
    if(right){
        texto += "Right - ";
    }
    else{
        texto += "No Right - ";
    }
    if(start){
        texto += "Start - ";
    }
    else{
        texto += "No Start - ";
    }
    if(select){
        texto += "Select - ";
    }
    else{
        texto += "No Select - ";
    }

    //Setea los textos en funcion de los valores
    document.getElementById("debug").innerHTML = texto;
}