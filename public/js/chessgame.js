const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const turnIndicator = document.getElementById("turnIndicator");
const checkIndicator = document.getElementById("checkIndicator");
const gameOverIndicator = document.getElementById("gameOverIndicator");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

function updateTurnUI() {
    if (chess.turn() === "w") {
        turnIndicator.innerText = "White's Turn";
    } else {
        turnIndicator.innerText = "Black's Turn";
    }
}

function updateCheckUI() {
    if (isKingInCheck()) {
        const checkedSide = chess.turn() === "w" ? "White" : "Black";
        checkIndicator.innerText = `⚠️ Check to ${checkedSide}`;
    } else {
        checkIndicator.innerText = "";
    }
}

function isKingInCheck() {
    if (typeof chess.in_check === "function") return chess.in_check();
    if (typeof chess.inCheck === "function") return chess.inCheck();
    if (typeof chess.isCheck === "function") return chess.isCheck();
    return false; 
}

function isCheckmate() {
    if (typeof chess.in_checkmate === "function") return chess.in_checkmate();
    if (typeof chess.isCheckmate === "function") return chess.isCheckmate();
    return false;
}

function updateGameOverUI() {
    if (isCheckmate()) {
        const winner = chess.turn() === "w" ? "Black" : "White";
        gameOverIndicator.innerText = `🏆 Game Over — ${winner} wins`;
    } else {
        gameOverIndicator.innerText = "";
    }
}

const renderBoard = ()=>{
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex)=>{
        row.forEach((square, squareindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            )

            squareElement.dataset.row = rowindex;  
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === 'w' ? "white" :"black"
                )
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole ===  square.color;

                pieceElement.addEventListener("dragstart", (e)=>{
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row: rowindex, col: squareindex};
                        e.dataTransfer.setData("text/plain",  "")
                    }
                })
                pieceElement.addEventListener("dragend", (e)=>{
                    draggedPiece = null;
                    sourceSquare = null;
                })
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function(e){
                e.preventDefault();
            })
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece ){
                    const targetSoruce = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    }
                    handleMove(sourceSquare, targetSoruce);
                }
            });
            boardElement.appendChild(squareElement);
        })
    })    
    if(playerRole === "b"){
        boardElement.classList.add("flipped")
    }else{
        boardElement.classList.remove("flipped")
    }

    updateTurnUI();
    updateCheckUI();
    updateGameOverUI();

};


const handleMove = (source, target) => {

    if (isCheckmate()) return; // freeze game after game over
    const to = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;

    const move = { 
        from:`${String.fromCharCode(97 + source.col)}${8 - source.row}`, 
        to:`${String.fromCharCode(97 + target.col)}${8 - target.row}`, 
        promotion:"q",
    };   
    socket.emit("move", move);
};

const getPieceUnicode = (piece)=>{
    const unicodePiece = {
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",
        P: "♟",
        R: "♜",
        N: "♞",
        B: "♝",
        Q: "♛",
        k: "♚",
    }
    return unicodePiece[piece.type] || "";
};

socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();    
})
socket.on("spectatorRole", function(){
    playerRole = null,
    renderBoard();
})
socket.on("boardState", function(fen){
    chess.load(fen);
    renderBoard();
    updateTurnUI();
    updateCheckUI();
})
socket.on("move", function(move){
    chess.move(move);
    renderBoard();
    updateTurnUI();
    updateCheckUI();
})
renderBoard();