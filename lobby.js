/* lobby.js - the backbone of the chess game */

var lobby = function (myID)
{
	this.id = myID;
	this.clients = [];
	//white is always position 0, black is position 1
//	this.maxClientSize = 150;//replace with default constatns (implement in the future)
	this.tableWidth = 8; //replace with default constatns
	this.tableHeight = 8;//replace with default constatns
	this.table = [[]];//replace with default constatns
	this.currentPlayerTurn = 0;
};

lobby.prototype.getLobbySize = function () {return this.clients.length;};
lobby.prototype.getID = function() {return this.id;};

lobby.prototype.insertClient = function(newClient) {
	return this.clients.push(newClient) - 1; //push new client on the back and return its position
};

//lobby.prototype.executeMessage = function (senderID, message) {};

module.exports = lobby;
