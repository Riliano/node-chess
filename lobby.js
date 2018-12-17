/* lobby.js - the backbone of the chess game */
const CHAR_CODE_a = "a".charCodeAt(0); //*shrug*
const TABLE_WIDTH = 8;
const TABLE_HEIGHT = 8;

const BLACK_KING = -1;
const BLACK_QUEEN = -2;
const BLACK_ROOK = -3;
const BLACK_BISHOP = -4;
const BLACK_KNIGHT = -5;
const BLACK_PAWN = -6;

const WHITE_KING = 1;
const WHITE_QUEEN = 2;
const WHITE_ROOK = 3;
const WHITE_BISHOP = 4;
const WHITE_KNIGHT = 5;
const WHITE_PAWN = 6;

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
	// Check if the current player is trying to capture his own piece
	if (this.table[y1][x1] * this.table[y2][x2] > 0)
		return false;

	switch (Math.abs(this.table[y1][x1])) {
		case WHITE_PAWN: return this.checkPawn(x1, y1, x2, y2);
		case WHITE_ROOK: return this.checkRook(x1, y1, x2, y2);
		case WHITE_BISHOP: return this.checkBishop(x1, y1, x2, y2);
		case WHITE_QUEEN: return this.checkQueen(x1, y1, x2, y2);
		case WHITE_KNIGHT: return this.checkKnight(x1, y1, x2, y2);
		default: break;
	};

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

lobby.prototype.inBoard = function(x, y) {
	return y >= 0 && y < this.tableHeight && x >= 0 && x < this.tableWidth;
}
lobby.prototype.oppositePieces = function(x1, y1, x2, y2) {
	return this.table[y1][x1]*this.table[y2][x2] < 0;
}

lobby.prototype.checkLine = function(x1, y1, x2, y2, stepx, stepy) {
	let tx = x1+stepx
	let ty = y1+stepy;
	while (this.inBoard(tx, ty) && this.table[ty][tx] === 0) {
		if (ty === y2 && tx === x2)
			return true;
		tx += stepx;
		ty += stepy;
	}
	if (this.inBoard(tx, ty) && this.oppositePieces(tx, ty, x1, y1))
		if (ty === y2 && tx === x2)
			return true;
	return false;
}

lobby.prototype.checkPawn = function (x1, y1, x2, y2) {
	let step = this.table[y1][x1]/BLACK_PAWN; // If white == -1 if black == 1
	let tx = x1
	let ty = y1+step;
// Single move forward
	if (this.table[ty][tx] === 0)
		if (x2 == tx && y2 == ty)
			return true;
// Start move
	ty = y1+2*step;
	if (((step < 0 && y1 === 6) || (step > 0 && y1 === 1))
	&& (this.table[ty][tx] === 0 && this.table[ty-step][tx] === 0))
		if (x2 == tx && y2 == ty)
			return true;
// Capture check
	ty = y1+step;
	tx = x1+1;
	if (this.oppositePieces(x1, y1, tx, ty))
		if (x2 === tx && y2 === ty)
			return true;
	tx = x1-1;
	if (this.oppositePieces(x1, y1, tx, ty))
		if (x2 === tx && y2 === ty)
			return true;
	// TODO Check if the move will cause a check

	// couldn't find a valid move
	return false;
}
lobby.prototype.checkRook = function (x1, y1, x2, y2) {
	let tx = x1, ty = y1;

	if (tx !== x2 && ty !== y2) // Not a + line
		return false;

	return this.checkLine(x1, y1, x2, y2, 0, 1)
		|| this.checkLine(x1, y1, x2, y2, 0, -1)
		|| this.checkLine(x1, y1, x2, y2, 1, 0)
		|| this.checkLine(x1, y1, x2, y2, -1, 0);
}
lobby.prototype.checkBishop = function (x1, y1, x2, y2) {
	let tx = x1, ty = y1;

	if (Math.abs(x2-tx) !== Math.abs(y2-ty)) // Not a X line
		return false;

	return this.checkLine(x1, y1, x2, y2, 1, 1)
		|| this.checkLine(x1, y1, x2, y2, 1, -1)
		|| this.checkLine(x1, y1, x2, y2, -1, 1)
		|| this.checkLine(x1, y1, x2, y2, -1, -1);
}
lobby.prototype.checkQueen = function (x1, y1, x2, y2) {
	let tx = x1, ty = y1;
	console.log("Hi");

	if ((Math.abs(x2-tx) !== Math.abs(y2-ty)) // Not a X line
	&& (tx !== x2 && ty !== y2)) // Not a + line
		return false;
	console.log("Hi2");


	return this.checkLine(x1, y1, x2, y2, 1, 1)
		|| this.checkLine(x1, y1, x2, y2, 1, -1)
		|| this.checkLine(x1, y1, x2, y2, -1, 1)
		|| this.checkLine(x1, y1, x2, y2, -1, -1)
		|| this.checkLine(x1, y1, x2, y2, 0, 1)
		|| this.checkLine(x1, y1, x2, y2, 0, -1)
		|| this.checkLine(x1, y1, x2, y2, 1, 0)
		|| this.checkLine(x1, y1, x2, y2, -1, 0);
}
lobby.prototype.checkKnight = function (x1, y1, x2, y2) {
	console.log(x1, y1, x2, y2);
	let possiblyValidMoves = [
		[x1+1, y1+2],
		[x1-1, y1+2],
		[x1+1, y1-2],
		[x1-1, y1-2],
		[x1+2, y1+1],
		[x1+2, y1-1],
		[x1-2, y1+1],
		[x1-2, y1-1]];

	for (let i=0;i<possiblyValidMoves.length;i++) {
		let tx = possiblyValidMoves[i][0];
		let ty = possiblyValidMoves[i][1];
		if (this.inBoard(tx, ty)
		&& (this.oppositePieces(x1, y1, tx, ty) || this.table[ty][tx] === 0)) {
			if (ty === y2 && tx === x2)
				return true;
		}
	}

	// couldn't find a valid move
	return false;
}

module.exports = lobby;
