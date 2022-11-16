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
        leerMemoria(INICIO_MEMORIAS + 0xDA2, 0x06, function(event2){
        var datos = new Uint8Array([...new Uint8Array(event.data), ...new Uint8Array(event2.data)]);
        actualizaDatos(datos);
        });
    });
}


function actualizaDatos(datos){
    
    // document.getElementById("debug").innerHTML +=  (" | " + datos[4] + " " + datos[6] + " " + datos[8]+ " " + datos[9] );
    
    var a, b, y, x, up, down, left, right, start, select, l, r; //Booleanas, indican si el boton se pulsa o no
    var mbyetUDLR = datos[4]; //Dirección 0x7E0015 -> 7E0DA2
    var lbyetUDLR = datos[4]; //Dirección 0x7E0015 -> 7E0DA4
    var nbyetUDLR = datos[4]; //Dirección 0x7E0016 
    var axlr = datos[2]; //Direccion 0x7E0017
    var naxlr = datos[3]; //Direccion 0x7E0018
    
    //Operaciones bitwise entre las direcciones de memoria y sus posibles valores
    //Asi se comprueba cada boton por separado
    if(((mbyetUDLR & 0x1) == 0x1) || ((lbyetUDLR & 0x1) == 0x1) || ((nbyetUDLR & 0x1) == 0x1)){
        right = true;
    }
    else{
        right = false;
    }
    if(((mbyetUDLR & 0x2) == 0x2) || ((lbyetUDLR &  0x2) == 0x2) || ((nbyetUDLR & 0x2) == 0x2) ){
        left = true;
    }
    else{
        left = false;
    }
    if(((mbyetUDLR & 0x4) == 0x4) || ((lbyetUDLR & 0x4) == 0x4)|| ((nbyetUDLR & 0x4) == 0x4)){
        down = true;
    }
    else{
        down = false;
    }
    if(((mbyetUDLR & 0x8) == 0x8) || ((lbyetUDLR & 0x8) == 0x8) || ((nbyetUDLR & 0x8) == 0x8)){
        up = true;
    }
    else{
        up = false;
    }
    if(((mbyetUDLR & 0x10) == 0x10) || ((lbyetUDLR & 0x10) == 0x10)|| ((nbyetUDLR & 0x10) == 0x10) ){
        start = true;
    }
    else{
        start = false;
    }
    if(((mbyetUDLR & 0x20) == 0x20) || ((lbyetUDLR & 0x20) == 0x20) || ((nbyetUDLR & 0x20) == 0x20)){
        select = true;
    }
    else{
        select = false
    }
    if(((axlr & 0x10) == 0x10) || ((naxlr & 0x10) == 0x10)){
        r = true;
    }
    else{
        r = false;
    }
    if(((axlr & 0x20) == 0x20) || ((naxlr & 0x20) == 0x20)){
        l = true;
    }
    else{
        l = false;
    }
    if(((axlr & 0x80) == 0x80) || ((naxlr & 0x80) == 0x80)){
        a = true;
    }
    else{
        a = false;
    }
    if(((mbyetUDLR & 0x80)==0x80) || ((lbyetUDLR & 0x80)==0x80) || (nbyetUDLR & 0x80)==0x80){
        b = true;
        }
    else{ 
        b= false;
    }
    if(((axlr & 0x40) == 0x40) || ((naxlr & 0x40) == 0x40)){
        x = true;
    }
    else{
        x = false;
    }
    if(((mbyetUDLR &  0x40)==0x40) || ((lbyetUDLR &  0x40)==0x40) || (nbyetUDLR & 0x40)==0x40){
        y = true;
        }
    else{ 
        y = false;
    }
    setBotones(a, b, y, x, up, down, left, right, start, select, l, r);
}

function empezarALeer(){
    intervaloLectura = setInterval(leer, 17);
}

/**
 * ACTUALIZACION TRACKING DE BOTONES
 */

//Así como primera prueba, sale todo como texto
//En el futuro, cada variable determina una imagen, por ejemplo
function setBotones(a, b, y, x, up, down, left, right, start, select, l, r){
    let texto = "";
    if(a){
        document.getElementById("a").src = "./images/ap.png";
    }
    else{
        document.getElementById("a").src = "./images/a.png";
    }
    if(b){
        document.getElementById("b").src = "./images/bp.png";
    }
    else{
        document.getElementById("b").src = "./images/b.png";
    }
    if(y){
        document.getElementById("y").src = "./images/yp.png";
    }
    else{
        document.getElementById("y").src = "./images/y.png";
    }
    if(x){
        document.getElementById("x").src = "./images/xp.png";
    }
    else{
        document.getElementById("x").src = "./images/x.png";
    }
    if(r){
        document.getElementById("r").src = "./images/rp.png";
    }
    else{
        document.getElementById("r").src = "./images/r.png";
    }
    if(l){
        document.getElementById("l").src = "./images/lp.png";
    }
    else{
        document.getElementById("l").src = "./images/l.png";
    }
    if(up){
        document.getElementById("up").src = "./images/dpad-upp.png";
    }
    else{
        document.getElementById("up").src = "./images/dpad-up.png";
    }
    if(down){
        document.getElementById("down").src = "./images/dpad-downp.png";
    }
    else{
        document.getElementById("down").src = "./images/dpad-down.png";
    }
    if(left){
        document.getElementById("left").src = "./images/dpad-leftp.png";
    }
    else{
        document.getElementById("left").src = "./images/dpad-left.png";
    }
    if(right){
        document.getElementById("right").src = "./images/dpad-rightp.png";
    }
    else{
        document.getElementById("right").src = "./images/dpad-right.png";
    }
    if(start){
        document.getElementById("start").src = "./images/startp.png";
    }
    else{
        document.getElementById("start").src = "./images/start.png";
    }
    if(select){
        document.getElementById("select").src = "./images/selectp.png";
    }
    else{
        document.getElementById("select").src = "./images/select.png";
    }

    //Setea los textos en funcion de los valores
    // document.getElementById("debug").innerHTML =  (datos[0] + " " + datos[1] + " " + datos[2] + " " + datos[3]+ " " + datos[4] + " " + datos[5] + " " + datos[6]+ " " + datos[7]+ " " + datos[8] + " " + datos[9]);
}