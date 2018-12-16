const MV_MSG_LEN = 4;
const CHAR_CODE_a = 97;
const UNINITIALIZED = -1;
const INITIALIZED = 0;

var lobbyID = document.getElementById("lobbyID").textContent;
var socket = new WebSocket("ws://localhost:3320");
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

		for (let y = 0; y < board.height; y++) {
			for (let x=0; x < board.width; x++) {
				let cell = document.createElement('div');
				cell.className = "cell";
				let idStr = ""+String.fromCharCode(CHAR_CODE_a+x)+(board.height-y);
				cell.setAttribute("id", idStr);

				cell.onclick = function(){
					msg = msg + idStr;
					if (msg.length === MV_MSG_LEN){
						console.log("Trying to move: "+msg);
						if (stat === INITIALIZED)
							socket.send(msg);
	
						selectedCell.style.opacity = 0.5; //default opacity
						msg = "";
					}else {
						this.style.opacity = 0.95;
						selectedCell = this;
					}
				};
				boardDiv.appendChild(cell);
			}
			if (board.width%2 === 0) //padding to preserve checkboard pattern
				boardDiv.appendChild(document.createElement('br'));
		}
		stat = INITIALIZED;
	} else if (stat === INITIALIZED) {
		console.log("Have to move: "+message.data);
	}
};
