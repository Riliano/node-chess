/* lobby.js - the backbone of the chess game */

var lobby = function (myID)
{
	this.id = myID;
	this.clients = new Map(); //Key: Integer, Value: Socket
	this.nextClientID = 0;
	//white is always position 0, black is position 1
//	this.maxClientSize = 150;//replace with default constatns (implement in the future)
	this.tableWidth = 8; //replace with default constatns
	this.tableHeight = 8;//replace with default constatns
	this.table = [[]];//replace with default constatns
	this.currentPlayerTurn = 0;
};

lobby.prototype.getLobbySize = function () {return this.clients.size;};
lobby.prototype.getID = function() {return this.id;};

lobby.prototype.insertClient = function(newClient) {
	let newClientID = this.nextClientID++;
	this.clients.set(newClientID, newClient);
	switch(newClientID) {
		case 0: newClient.send("WHTE");break; // notify 1st client that he's white
		case 1: newClient.send("BLCK");break; // notify 2nd client that he's white
		default: newClient.send("SPEC");break; // notify everyone else that its spectator
	}
	return newClientID;
};
lobby.prototype.removeClient = function(clientID) {
	this.clients.delete(clientID);
}

lobby.prototype.broadcast = function(message) {
	for (let socket of this.clients.values()) {
		socket.send(message);
	}
}

lobby.prototype.checkMessageValidity = function(message) { //TODO
	return true;
}
lobby.prototype.checkMoveValidity = function(message, senderID) { //TODO
	// Check if there are two players
	if (this.nextClientID < 2)
		return false;
	// Check if its the player's turn
	if (this.currentPlayerTurn !== senderID)
		return false;
	if (!this.checkMessageValidity(message))
		return false
	return true;
}
lobby.prototype.executeMove = function(move) {

	this.currentPlayerTurn = (this.currentPlayerTurn+1)%2;
}
//lobby.prototype.executeMessage = function (senderID, message) {};

module.exports = lobby;
