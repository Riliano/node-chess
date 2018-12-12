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

var allLobbys = [];

let isNaN = function(x) {
	return x!= x; //stupid js nan check
}

app.get("/create", function (req, res) {
	let newLobbyID = allLobbys.length;
	allLobbys.push(new lobby(allLobbys.length));
	res.render("create.ejs", {id: newLobbyID} );
	console.log("New lobby with id " + newLobbyID);
});

app.get("/join/:id", function (req, res) {
	var id = parseInt(req.params.id);
	if (isNaN(id)) {
		res.render("invalid.ejs", {id: req.params.id});
		return;
	}
	for (let i=0;i<allLobbys.length;i++) {
		if (id == allLobbys[i].getID()) {
			console.log("User found a lobby");
			res.render("lobby.ejs", {id: id});
			return;
		}
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
	let lobbyNo = -1; //position in allLobbyArray
	let clientID = -1; //position in the lobby

	socket.on("message", function incoming(message) {
		if (stat === -1) {
			console.log("Hi "+message);
			lobbyID = parseInt(message);

			if (!isNaN(lobbyID)) {
				for (let i=0;i<allLobbys.length;i++) {
					if (lobbyID === allLobbys[i].id) {
						stat = 0;
						lobbyNo = i;
						clientID = allLobbys[lobbyNo].insertClient(socket);
						break;
					}
				}
						
			}
		}

		if (stat === 0) {
			console.log("[MSG] "+clientID+"@"+lobbyNo+": "+message);
			for (let i=0;i<allLobbys[lobbyNo].clients.length;i++) {
				allLobbys[lobbyNo].clients[i].send("Hello from server: "+i);
			}
		}
	});
	
});

server.listen(port, function() {console.log("Listening on: "+port);});
