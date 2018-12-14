var url = require("url");
var http = require("http");
var express = require("express");
var ws = require("ws");

var lobby = require("./lobby");

var port = process.argv[2];

var app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/client"));

var server = http.createServer(app);
const wss = new ws.Server({server});

var allLobbys = new Map();
var nextLobbyID = 0;

let isNaN = function(x) {
	return x!== x; //stupid js NaN check
}

app.get("/create", function (req, res) {
	let newLobbyID = nextLobbyID++; 
	allLobbys.set(newLobbyID, new lobby(newLobbyID));
	res.render("create.ejs", {id: newLobbyID} );
	console.log("New lobby with id " + newLobbyID);
});

app.get("/join/:id", function (req, res) {
	var id = parseInt(req.params.id);
	if (isNaN(id)) {
		res.render("invalid.ejs", {id: req.params.id});
		return;
	}
	if (allLobbys.has(id)) {
		console.log("User found a lobby");
		res.render("lobby.ejs", {id: id});
		return;
	}

	res.render("invalid.ejs", {id: req.params.id});
});

app.get("/", function (req, res) {
	res.render("index.html");
	console.log("Sending a response");
});

wss.on("connection", function (socket) {
	console.log("new socket connection");

	let stat = -1;
	let lobbyID = -1;
	let clientID = -1; //position in the lobby
	let localLobby = null;

	socket.on("message", function incoming(message) {
		if (stat === -1) {
			console.log("Hi "+message);
			lobbyID = parseInt(message);

			if (!isNaN(lobbyID)) {
				if (allLobbys.has(lobbyID)) {
					stat = 0;
					localLobby = allLobbys.get(lobbyID);
					clientID = localLobby.insertClient(socket);
				}
			}
		}

		if (stat === 0) {
			if (localLobby.checkMoveValidity(message, clientID)) {
				localLobby.executeMove(message);
				localLobby.broadcast(message);
				console.log("[MSG] "+clientID+"@"+lobbyID+": "+message);
			}
		}
	});

	socket.on("close", function (code) {
		console.log("close code from "+lobbyID+"@"+clientID+": "+code);
		if (code == "1001" && stat !== -1) {
			localLobby.removeClient(clientID);
		}
		stat = -1;
	});
});

server.listen(port, function() {console.log("Listening on: "+port);});
