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

var numLobbys = 0;
var allLobbys = [];

let isNaN = function(x) {
	return x!= x; //stupid js nan check
}

app.get("/create", function (req, res) {
	allLobbys.push(new lobby(numLobbys));
	let newLobbyID = numLobbys;
	res.render("create.ejs", {id: newLobbyID} );
	console.log("New lobby with id " + newLobbyID);
	numLobbys++;
});

app.get("/join/:id", function (req, res) {
	var id = parseInt(req.params.id);
	if (isNaN(id))
	{
		res.render("invalid.ejs", {id: req.params.id});
		return;
	}
	for (let i=0;i<numLobbys;i++)
	{
		if (id == allLobbys[i].getID())
		{
			console.log("User found a lobby");
			res.render("lobby.ejs", {id: id});
			return;
		}
	}

	res.render("invalid.ejs", {id: req.params.id});

//	res.render("join.ejs", {});
});

app.get("/", function (req, res) {
	res.render("index.html");
	console.log("Sending a response");
});

wss.on("connection", function (socket) {
	console.log("new socket connection");

	let stat = -1;
	let lobbyID = -1;

	socket.on("message", function incoming(message) {
		if (stat === -1) {
			console.log("Hi "+message);
			lobbyID = parseInt(message);
			if (!isNaN(lobbyID)) {
				stat = 0;
			}
		}

		if (stat === 0) {
			console.log("[MSG] "+": "+message);
		}
	});
	
});

server.listen(port, function() {console.log("Listening on: "+port);});
