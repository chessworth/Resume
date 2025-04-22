import React, { useState, useEffect } from 'react';
import styles from './GameStyles.module.css';
import PlayerSeat from './PlayerSeat';
import SettingsMenu from './SettingsMenu';
import { compareHands, setCustomRules } from './utils/pokerUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faCoins, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

const suits = ['H', 'D', 'S', 'C'];
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

const PokerTable = () => {
  const [players, setPlayers] = useState([]);
  const [settings, setSettings] = useState({
    ante: 1,
    maxBackShowRejects: 2
  });
  const [pot, setPot] = useState(0);
  const [turnIndex, setTurnIndex] = useState(null);
  const [lastBet, setLastBet] = useState(0);
  const [currentRound, setCurrentRound] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const [pauseGame, setPauseGame] = useState(false);
  const [customSettings, setCustomSettings] = useState({enableSpecial235: true,
                                                        enableSuited235: true,
                                                        showLoserOnTie: true,
                                                        allowBackShow: true,
                                                    });
  const [betAmount, setBetAmount] = useState(1);
  const [minBetAmount, setMinBetAmount] = useState(settings.ante);
  const [backShowRequest, setBackShowRequest] = useState(null);
  const [showdownTime, setShowdownTime] = useState(null);
  const [revealedHands, setRevealedHands] = useState([]);

  useEffect((turnIndex) => {
    if (players.length && turnIndex === null) {
      setTurnIndex(0); // Start with first player
    }
    }, [players]);

  useEffect(() => {
    if ( !showdownTime ) return;
  
    const timeout = setTimeout(() => {
      startHand();
    }, showdownTime);
  
    return () => clearTimeout(timeout);
  });

  const toggleSetting = (key) => {
    const updated = { ...customSettings, [key]: !customSettings[key] };
    setCustomSettings(updated);
    setCustomRules(updated);
    };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addPlayer = (name, chips) => {
    setPlayers(prev => [
      ...prev,
      {
        id: Date.now(),
        name,
        chips,
        cards: [],
        revealed: false,
        folded: false,
        handRank: '',
        backShowRejects: 0
      }
    ]);
  };

    const startGame = () => {
        setGameRunning(true);
        setPauseGame(false);
        startHand();
    };
    
    const startHand = () => {
        setShowdownTime(null);
        const activePlayers = players.filter(p => p.chips >= settings.ante);
        if (activePlayers.length <= 1) {
            setGameRunning(false);
            return;
        }
        const deck = generateShuffledDeck();
        const updated = players.map(p =>
        p.chips >= settings.ante
            ? {
                ...p,
                cards: deck.splice(0, 3),
                chips: p.chips - settings.ante,
                folded: false,
                revealed: false,
                handRank: '',
                backShowRejects: 0
            }
            : p
        );
        setPlayers(updated);
        setPot(settings.ante * activePlayers.length);
        setLastBet(0);
        setMinBetAmount(settings.ante);
        setTurnIndex(0);
        setCurrentRound([]);
        setRevealedHands([]);
    };

  const generateShuffledDeck = () => {
    const deck = [];
    for (let s of suits) {
      for (let r of ranks) {
        deck.push(r + s);
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const nextTurn = () => {
    let next = (turnIndex + 1) % players.length;
    while (players[next].folded) {
      next = (next + 1) % players.length;
    }
    setTurnIndex(next);
  };

  const fold = (id) => {
    const updated = players.map(p =>
      p.id === id ? { ...p, folded: true } : p
    );
    setPlayers(updated);
    if (updated.filter(p => !p.folded).length === 1) {
      declareWinner(updated.find(p => !p.folded));
    } else {
      nextTurn();
    }
  };

  const bet = (id, amount) => {
    setMinBetAmount(amount);
    const updated = players.map(p =>
      p.id === id ? { ...p, chips: p.chips - amount } : p
    );
    setPlayers(updated);
    setPot(pot + amount);
    setLastBet(amount);
    nextTurn();
  };

  const callAndShow = (id) => {
    const updated = players.map(p =>
      p.id === id ? { ...p, chips: p.chips - lastBet, revealed: true } : { ...p, revealed: true}
    );
    setRevealedHands([ ...revealedHands, id, players[getPreviousActivePlayerIndex(turnIndex)].id])
    console.log(updated);
    setPlayers(updated);
    setPot(pot + lastBet);
    showdown(id, players[getPreviousActivePlayerIndex(turnIndex)].id);
  };
  
  const getPreviousActivePlayerIndex = (fromIndex) => {
    let i = (fromIndex - 1 + players.length) % players.length;
    while (i !== fromIndex) {
      if (!players[i].folded && players[i].chips > 0) return i;
      i = (i - 1 + players.length) % players.length;
    }
    return null;
  };

  const requestBackShow = () => {
    const prevPlayerIndex = getPreviousActivePlayerIndex(turnIndex);
    if (prevPlayerIndex === null) return;

    setBackShowRequest({
      requesterId: players[turnIndex].id,
      defenderId: players[prevPlayerIndex].id
    });
    const defender = players[prevPlayerIndex];
    if (defender.backShowRejects >= settings.maxBackShowRejects) {
        showdown(players[turnIndex].id, prevPlayerIndex, true);
    }
  };

  const showdown = (requesterId, defenderId, isBackShow = false) => {
    const requester = players.find(p => p.id === requesterId);
    const defender = players.find(p => p.id === defenderId)
    const result = compareHands(requester.cards, defender.cards, requesterId, defender.id);

    const winnerId = result ? defenderId : requesterId;
    const loserId = result ? requesterId : defenderId;
    if (isBackShow) {   
        setRevealedHands([...revealedHands, loserId]);
        const updated = players.map(p =>
            p.id === loserId ? { ...p, folded: true} : p
          );
        setPlayers(updated);
        nextTurn();
        setBackShowRequest(null);
    }
    else {
        declareWinner(players.find(p => p.id === winnerId));
    }
  };

  const rejectBackShow = (requesterId) => {
    const updated = players.map(p =>
      p.id === turnIndex ? {
        ...p,
        backShowRejects: p.backShowRejects + 1
      } : p
    );
    setPlayers(updated);
    nextTurn();
    setBackShowRequest(null);
  };

  const declareWinner = (winner) => {
    const updated = players.map(p =>
      p.id === winner.id ? { ...p, chips: p.chips + pot } : p
    );
    setPlayers(updated);
    setPot(0);
    setTurnIndex(null);
    alert(`${winner.name} wins the pot!`);
    setShowdownTime(3000);
  };

  const adjustChips = (id, delta) => {
    setPlayers(players.map(p =>
      p.id === id ? { ...p, chips: Math.max(p.chips + delta, 0) } : p
    ));
  };

  return (
    <div className={styles.tableContainer}>
      <button className={styles.sidebarToggle} onClick={() => setMenuOpen(!menuOpen)}>
        <FontAwesomeIcon icon={faGear} size='lg'/>
      </button>

      <div className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
      <SettingsMenu
        settings={settings}
        customSettings={customSettings}
        updateSetting={updateSetting}
        toggleCustomSetting={toggleSetting}
        addPlayer={addPlayer}
        pauseGame={pauseGame}
        setPauseGame={setPauseGame}
        />
      </div>
      <div className={styles.pot}>Pot: <FontAwesomeIcon icon={faCoins} className={styles.potIcon}/> {pot}</div>
      {!gameRunning && (
        <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
         <button onClick={startGame} className={styles.revealButton}>Start Game</button>
        </div>
        )}
      <div className={styles.tableCircle}>
        {players.map((p, i) => {
        const angle = (360 / players.length) * i;
        const radians = (angle * Math.PI) / 180;
        const radius = 360;
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;

        return (
        <div
            key={p.id}
            className={styles.playerSeat}
            style={{ top: `40%`, left: `37%`, transform: `translate(${x}px, ${y}px)` }}
        >
            <PlayerSeat
            player={p}
            isTurn={i === turnIndex}
            adjustChips={adjustChips}
            revealedHands={revealedHands}
            />
        </div>
            );
        })}
    </div>
    {gameRunning && (
        <div className={styles.actionButtonsContainer}>
          {!showdownTime && !players[turnIndex].folded && !backShowRequest && (
            <>
              <input
                type="number"
                min={minBetAmount}
                max={players[turnIndex].chips}
                placeholder="Bet Amount"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                className={styles.betInput}
                />
              <button onClick={() => fold(players[turnIndex].id)} className={styles.foldButton}>Fold</button>
              <button onClick={() => bet(players[turnIndex].id, betAmount)} className={styles.betButton}>Bet</button>
              {players.filter(p => !p.folded).length === 2 && (
                <button onClick={() => callAndShow(players[turnIndex].id)} className={styles.callButton}>Call</button>
              )}
              {customSettings.allowBackShow && players.filter(p => !p.folded).length > 2 &&(
                <button onClick={requestBackShow} className={styles.backShowButton}>Back Show</button>
              )}
            </>
          )}
          {backShowRequest && (
                <>
                <p>{players.find(p => p.id === backShowRequest.requesterId)?.name} requests a Back Show!</p>
                <button className={styles.backShowButton} onClick={() => showdown(backShowRequest.requesterId, backShowRequest.defenderId, true)}>
                    <FontAwesomeIcon icon={faCheck}></FontAwesomeIcon> Accept
                    </button>
                <button className={styles.backShowButton} onClick={() => rejectBackShow(backShowRequest.requesterId)}>
                    <FontAwesomeIcon icon={faXmark}></FontAwesomeIcon> Reject
                    </button>
                </>
          )}
        </div>
      )}
    </div>
  );
};

export default PokerTable;
