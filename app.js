var url = require("url");
var http = require("http");
var express = require("express");

//var port = process.argv[2];
var port = 1234;

var app = express();
app.use(express.static(__dirname + "/client"));

var server = http.createServer(app);

app.get("/", function (req, res) {
	res.render("index.html");
	console.log("Sending a response");
});


server.listen(port, function() {console.log("Listening on: "+port);});
