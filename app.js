var url = require("url");
var http = require("http");
var express = require("express");

var port = process.argv[2];

var lobby = require("./lobby");

var app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/client"));

var server = http.createServer(app);

var numLobbys = 0;
var allLobbys = [];

app.get("/create", function (req, res) {
	allLobbys.push(new lobby(numLobbys));
	let newLobbyID = numLobbys;
	res.render("create.ejs", {id: newLobbyID} );
	console.log("New lobby with id " + newLobbyID);
	numLobbys++;
});

app.get("/", function (req, res) {
	res.render("index.html");
	console.log("Sending a response");
});


server.listen(port, function() {console.log("Listening on: "+port);});
