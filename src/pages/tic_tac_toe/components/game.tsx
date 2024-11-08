import React, { useState } from 'react';
import logo from './logo.svg';
import Board from './Board';
import '../index.css';

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
      description = move > 0 ? ('You are at Move #' + move+ ': Row ' + squares.rowIndex + ', Column ' + squares.colIndex) : 'You are at game start';
      return (
        <li key={move}>{description}
        </li>
      );
    }
    if (move > 0) {
      description = 'Move #' + move + ': Row ' + squares.rowIndex + ', Column ' + squares.colIndex;
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
