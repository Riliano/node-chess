const MV_MSG_LEN = 4;
const CHAR_CODE_a = 97;
const UNINITIALIZED = -1;
const INITIALIZED = 0;

var numberToName = {};
numberToName[-1] = "black_king";
numberToName[-2] = "black_queen";
numberToName[-3] = "black_rook";
numberToName[-4] = "black_bishop";
numberToName[-5] = "black_knight";
numberToName[-6] = "black_pawn";

numberToName[1] = "white_king";
numberToName[2] = "white_queen";
numberToName[3] = "white_rook";
numberToName[4] = "white_bishop";
numberToName[5] = "white_knight";
numberToName[6] = "white_pawn";

var lobbyID = document.getElementById("lobbyID").textContent;
var socket = new WebSocket("ws://"+window.location.host);
socket.onopen = function(){socket.send(lobbyID);};

let stat = UNINITIALIZED;
let board = null;
var boardDiv = document.querySelector(".board");
var selectedCell = null;
var msg = "";

socket.onmessage = function(message){
	if (stat === UNINITIALIZED) {
		board = JSON.parse(message.data);
		boardDiv.style.width = (board.width+1)*50 + "px";
		let header = document.getElementById("header");
		switch (board.role) {
			case "WHTE": header.appendChild(document.createTextNode("You are playing as white"));break;
			case "BLCK": header.appendChild(document.createTextNode("You are playing as black"));break;
			case "SPEC": header.appendChild(document.createTextNode("You are a spectator"));break;
		};

		for (let y = 0; y < board.height; y++) {
			for (let x=0; x < board.width; x++) {
				let cell = document.createElement('div');
				cell.className = "cell";
				let idStr = ""+String.fromCharCode(CHAR_CODE_a+x)+(board.height-y);
				cell.setAttribute("id", idStr);

				cell.onclick = function(){
					if (msg === idStr) { // Check if a cell is clicked twice and deselect it
						msg = "";
						selectedCell.style.opacity = 0.5; //default opacity
						cell.style.opacity = 0.5;
						return;
					}
					msg = msg + idStr;
					if (msg.length === MV_MSG_LEN){
						console.log("Trying to move: "+msg);
						if (stat === INITIALIZED)
							socket.send(msg);
	
						selectedCell.style.opacity = 0.5; //default opacity
						cell.style.opacity = 0.5;
						msg = "";
					}else {
						this.style.opacity = 0.95;
						selectedCell = this;
					}
				};

				if (board.table[y][x] !== 0) {
					let piece = document.createElement('div');
					piece.className = "piece";
					piece.setAttribute("id", numberToName[board.table[y][x]]);
					cell.appendChild(piece);
				}

				boardDiv.appendChild(cell);
			}
			if (board.width%2 === 0) //padding to preserve checkboard pattern
				boardDiv.appendChild(document.createElement('br'));
		}
		stat = INITIALIZED;
	} else if (stat === INITIALIZED) {
		let cell1 = message.data.substring(0, 2);
		let cell2 = message.data.substring(2, 4);
		console.log(cell1+cell2);
		let source = document.getElementById(cell1);
		let dest = document.getElementById(cell2);
		if (!source.hasChildNodes()) {
			console.log("Recived weird command from server");
			return;
		}

		if (dest.hasChildNodes())
			dest.removeChild(dest.childNodes[0]);
		dest.appendChild(source.childNodes[0]);
	}
};
