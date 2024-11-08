import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Square from './pages/tic_tac_toe/components/square';
import './pages/tic_tac_toe/index.css';

function Board({xIsNext, squares, currentMove, onPlay} : {xIsNext : boolean, squares : string[], currentMove: number, onPlay : (s : string[], i: number) => void}) {
  function handleClick(i : number) {
    if (squares[i] || calculateWinner(squares) ) {
      return;
    }
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    onPlay(nextSquares, i);
  }

  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = "Winner: " + winner;
  }
  else if (currentMove == 9) {
    status = "Game Drawn";
  }
  else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }
  const rows = [...Array(3)].map( (_, numRow) => {
    const cols = [...Array(3)].map((_, numCol) =>
      {
        const index = 3 * (numRow) + (numCol);
        return (
          <Square key={index} value={squares[index]} onSquareClick={() => handleClick(index)} />
        );
      });
      return <div key={numRow} className="board-row">{cols}</div>;
  });

  return (
    <>
      <div className="status">{status}</div>
      {rows}
    </>
  );
}
function calculateWinner(squares : string[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      highlightWinner(squares, [a,b,c]);
      return squares[a];
    }
  }
  highlightWinner(squares);
  return null;
}
function highlightWinner(squares : string[], line? : number[]) {
  if (line) {
    line.forEach((num) => {
      const rowVal = Math.round((num-1)/3);
      const colVal = num%3;
      const cell = document.getElementsByClassName('game-board')[0].children[rowVal+1].children[colVal];
      cell.classList.add('highlight');
    })
  }
  else {
    const highlighted = document.getElementsByClassName('highlight');
    if (highlighted.length != 0){
      for (let i = 0; i < highlighted.length; i++){
        highlighted[i].classList.remove('highlight');
      }
    }
  }
}

class GameHistory {
  Board: string[] = Array<string>(9).fill('');
  rowIndex: number = 0;
  colIndex: number = 0;
}

function Game() {
  const [history, setHistory] = useState(Array<GameHistory>(1).fill(new GameHistory()));
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove].Board;

  function handlePlay(nextSquares: string[], index: number) {
    let addedHistory: GameHistory = {} as GameHistory;
    addedHistory.Board = nextSquares;
    addedHistory.rowIndex = Math.round((index-1)/3) + 1;
    addedHistory.colIndex = index%3 + 1;

    const nextHistory = [...history.slice(0, currentMove + 1), addedHistory];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move == currentMove) {
      description = move > 0 ? ('You are at move #' + move+ ': Row ' + squares.rowIndex + ', Column ' + squares.colIndex) : 'You are at game start';
      return (
        <li key={move}>{description}
        </li>
      );
    }
    if (move > 0) {
      description = 'move #' + move + ': Row ' + squares.rowIndex + ', Column ' + squares.colIndex;
    } else {
      description = 'Go to game start';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-info">
        <ul>{moves}</ul>
      </div>
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} currentMove={currentMove} onPlay={handlePlay} />
      </div>
    </div>
  );
}

export default Game;
