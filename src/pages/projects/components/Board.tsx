import React, { useState } from 'react';
import logo from './logo.svg';
import Square from './square';

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
  
  export default Board;