/* lobby.js - the backbone of the chess game */
const CHAR_CODE_a = "a".charCodeAt(0); //*shrug*
const TABLE_WIDTH = 8;
const TABLE_HEIGHT = 8;
const TABLE = [
				[-3,-5,-4,-2,-1,-4,-5,-3],
				[-6,-6,-6,-6,-6,-6,-6,-6],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0, 0, 0],
				[ 6, 6, 6, 6, 6, 6, 6, 6],
				[ 3, 5, 4, 2, 1, 4, 5, 3]];

var lobby = function (myID)
{
	this.id = myID;
	this.clients = new Map(); //Key: Integer, Value: Socket
	this.nextClientID = 0;
	//white is always position 0, black is position 1
//	this.maxClientSize = 150;//replace with default constatns (implement in the future)
	this.tableWidth = TABLE_WIDTH;
	this.tableHeight = TABLE_HEIGHT;
	this.table = TABLE;
	this.currentPlayerTurn = 0;
};

lobby.prototype.getLobbySize = function () {return this.clients.size;};
lobby.prototype.getID = function() {return this.id;};

lobby.prototype.insertClient = function(newClient) {
	let newClientID = this.nextClientID++;
	let firstMessage = {
		width: this.tableWidth,
		height: this.tableHeight,
		table: this.table
	};
	this.clients.set(newClientID, newClient);
	switch(newClientID) {
		case 0: firstMessage.role="WHTE";break; // notify 1st client that he's white
		case 1: firstMessage.role="BLCK";break; // notify 2nd client that he's black
		default: firstMessage.role="SPEC";break; // notify everyone else that its spectator
	}

	newClient.send(JSON.stringify(firstMessage));
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

lobby.prototype.checkMessageValidity = function(message) {
	// Message must be a string of format [a-g][1-8][a-g][1-8]
	if (typeof message !== "string")
		return false;
	if (message.length !== 4)
		return false;
	let chars = message.split('');
	let checkLetter = function(c){return 'a' <= c && c <= 'h';};
	let checkNumber = function(c){return '1' <= c && c <= '8';};
	return checkLetter(chars[0])
		&& checkNumber(chars[1])
		&& checkLetter(chars[2])
		&& checkNumber(chars[3]);
}
lobby.prototype.checkMoveValidity = function(move, senderID) { //TODO
	// Check if there are two players
	if (this.nextClientID < 2)
		return false;
	// Check if its the player's turn
	if (this.currentPlayerTurn !== senderID)
		return false;
	if (!this.checkMessageValidity(move))
		return false

	let x1 = move.charCodeAt(0) - CHAR_CODE_a;
	let y1 = this.tableHeight - parseInt(move.charAt(1));
	let x2 = move.charCodeAt(2) - CHAR_CODE_a;
	let y2 = this.tableHeight - parseInt(move.charAt(3));

	//Check if the current player can move the selected figure
	//Also catches attempts to move an empty cell
	if ((this.currentPlayerTurn === 0 && this.table[y1][x1] <= 0)
	|| (this.currentPlayerTurn === 1 && this.table[y1][x1] >= 0))
		return false;


	return true;
}
lobby.prototype.executeMove = function(move) {
	let x1 = move.charCodeAt(0) - CHAR_CODE_a;
	let y1 = this.tableHeight - parseInt(move.charAt(1));
	let x2 = move.charCodeAt(2) - CHAR_CODE_a;
	let y2 = this.tableHeight - parseInt(move.charAt(3));

	this.table[y2][x2] = this.table[y1][x1];
	this.table[y1][x1] = 0;

	this.currentPlayerTurn = (this.currentPlayerTurn+1)%2;
}
//lobby.prototype.executeMessage = function (senderID, message) {};

module.exports = lobby;
