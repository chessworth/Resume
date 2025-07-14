import { useState, useEffect, useRef } from 'react';
import styles from './GameStyles.module.css';
import PlayerSeat from './PlayerSeat';
import SettingsMenu from './SettingsMenu';
import { compareHands, setCustomRules } from './utils/pokerUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faCoins, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
// import ChipStack from './ChipStack';

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
  const [gameTurnIndex, setGameTurnIndex] = useState(0);
  const [lastBet, setLastBet] = useState(0);
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
  const [playerRevealedCards, setPlayerRevealedCards] = useState({});
  // Add a new state to track the winner and loser of the showdown
  const [showdownResult, setShowdownResult] = useState({ 
    winnerId: null, 
    loserId: null 
  });

  // Add a ref for the sidebar
  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);

  // Add effect to handle clicks outside sidebar
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if clicking the toggle button
      if (toggleButtonRef.current && toggleButtonRef.current.contains(event.target)) {
        return;
      }
      
      // Close if sidebar is open and click is outside sidebar
      if (menuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

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
        backShowRejects: 0,
        blind: true // Start as blind
      }
    ]);
  };

    const startGame = () => {
        setGameRunning(true);
        setPauseGame(false);
        setGameTurnIndex(0);
        startHand();
    };
    
    const startHand = () => {
        setShowdownTime(null);
        // Reset all revealed cards
        setPlayerRevealedCards({});
        // Reset showdown result
        setShowdownResult({ winnerId: null, loserId: null });
        
        const activePlayers = players.filter(p => p.chips >= settings.ante);
        if (activePlayers.length <= 1) {
            setGameRunning(false);
            return;
        }
        //rotating starting position for each hand
        const nextGameTurnIndex = (gameTurnIndex + 1) % players.length;
        setGameTurnIndex(nextGameTurnIndex);

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
                backShowRejects: 0,
                blind: true // Reset to blind at start of hand
            }
            : p
        );
        setPlayers(updated);
        setPot(settings.ante * activePlayers.length);
        setLastBet(settings.ante);
        setMinBetAmount(settings.ante);
        setBetAmount(settings.ante);
        setTurnIndex(gameTurnIndex);
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
    
    // Reset revealed cards for the current player
    if (turnIndex !== null) {
      const currentPlayerId = players[turnIndex].id;
      setPlayerRevealedCards(prev => ({
        ...prev,
        [currentPlayerId]: {} // Clear revealed cards for current player
      }));
    }
    
    // Debug log
    console.log('Next turn:', {
      player: players[next].name,
      isBlind: players[next].blind,
      minBetAmount,
      lastBet
    });
    
    setTurnIndex(next);
  };

  const fold = (id) => {
    // Reset revealed cards for the player who folded
    setPlayerRevealedCards(prev => ({
      ...prev,
      [id]: {} // Clear revealed cards
    }));
    
    const updated = players.map(p =>
      p.id === id ? { ...p, folded: true } : p
    );
    setPlayers(updated);
    if (updated.filter(p => !p.folded).length === 1) {
      // Set the showdown result before declaring the winner
      const winner = updated.find(p => !p.folded);
      setShowdownResult({ 
        winnerId: winner.id, 
        loserId: id // The last player to fold is considered the "loser"
      });
      declareWinner(winner);
    } else {
      // Before moving to next turn, check if we need to reset bet amounts
      const nextPlayerIndex = getNextActivePlayerIndex(turnIndex);
      if (nextPlayerIndex !== null) {
        const nextPlayer = players[nextPlayerIndex];
        if (nextPlayer.blind) {
          // If next player is blind, reset to the original bet amount
          setMinBetAmount(lastBet);
          setBetAmount(lastBet);
        }
      }
      nextTurn();
    }
  };

  const bet = (id, amount) => {
    // Reset revealed cards for the player who bet
    setPlayerRevealedCards(prev => ({
      ...prev,
      [id]: {} // Clear revealed cards
    }));
    
    const player = players.find(p => p.id === id);
    const isBlind = player.blind;
    
    const updated = players.map(p =>
      p.id === id ? { ...p, chips: p.chips - amount } : p
    );
    setPlayers(updated);
    setPot(pot + amount);
    
    // Update lastBet to the current bet amount
    setLastBet(amount);
    
    // If the player is betting blind, the next player's minimum bet should be doubled
    // UNLESS the next player is also blind
    const nextPlayerIndex = getNextActivePlayerIndex(turnIndex);
    if (nextPlayerIndex !== null) {
      const nextPlayer = players[nextPlayerIndex];
      
      if (isBlind && !nextPlayer.blind) {
        // If current player is blind and next player is not, double the minimum bet
        setMinBetAmount(amount * 2);
        setBetAmount(amount * 2);
      } else {
        // Otherwise, just match the current bet
        setMinBetAmount(amount);
        setBetAmount(amount);
      }
    }
    
    // Debug log
    console.log('Bet placed:', {
      player: player.name,
      amount,
      isBlind,
      nextPlayerBlind: nextPlayerIndex !== null ? players[nextPlayerIndex].blind : null,
      newMinBet: minBetAmount
    });
    
    nextTurn();
  };

  const callAndShow = (id) => {
    const updated = players.map(p =>
      p.id === id ? { ...p, chips: p.chips - lastBet, revealed: true } : { ...p, revealed: true}
    );
    setRevealedHands([ ...revealedHands, id, players[getPreviousActivePlayerIndex(turnIndex)].id]);
    setPlayers(updated);
    setPot(pot + lastBet);
    
    // Add delay before showdown
    setTimeout(() => {
      showdown(id, players[getPreviousActivePlayerIndex(turnIndex)].id);
    }, 1000); // 1000ms = 1 second delay
  };
  
  const getPreviousActivePlayerIndex = (fromIndex) => {
    let i = (fromIndex - 1 + players.length) % players.length;
    while (i !== fromIndex) {
      if (!players[i].folded && players[i].chips > 0) return i;
      i = (i - 1 + players.length) % players.length;
      // Prevent infinite loop if all players are folded or out of chips
      if (i === fromIndex) break;
    }
    return null;
  };

  const getNextActivePlayerIndex = (fromIndex) => {
    let i = (fromIndex + 1) % players.length;
    while (i !== fromIndex) {
      if (!players[i].folded && players[i].chips > 0) return i;
      i = (i + 1) % players.length;
      // Prevent infinite loop if all players are folded or out of chips
      if (i === fromIndex) break;
    }
    return null;
  };

  const requestBackShow = () => {
    const prevPlayerIndex = getPreviousActivePlayerIndex(turnIndex);
    if (prevPlayerIndex === null) return;

    // Reset revealed cards for the current player
    const currentPlayerId = players[turnIndex].id;
    setPlayerRevealedCards(prev => ({
      ...prev,
      [currentPlayerId]: {} // Clear revealed cards for current player
    }));

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
    const defender = players.find(p => p.id === defenderId);
    
    const result = compareHands(requester.cards, defender.cards, requesterId, defender.id);
    
    const winnerId = result > 0 ? requesterId : (result < 0 ? defenderId : requesterId);
    const loserId = result > 0 ? defenderId : (result < 0 ? requesterId : defenderId);
    
    if (isBackShow) {   
      // For backshow, only temporarily show the result, then clear it
      setShowdownResult({ winnerId, loserId });
      
      setRevealedHands([...revealedHands, loserId]);
      const updated = players.map(p =>
        p.id === loserId ? { ...p, folded: true} : p
      );
      setPlayers(updated);
      
      // Clear the showdown result after a short delay since game continues
      setTimeout(() => {
        setShowdownResult({ winnerId: null, loserId: null });
      }, 1500);
      
      nextTurn();
      setBackShowRequest(null);
    }
    else {
      // For final showdown, set the result and keep it until next hand
      setShowdownResult({ winnerId, loserId });
      declareWinner(players.find(p => p.id === winnerId));
    }
  };

  const rejectBackShow = (requesterId) => {
    // Reset revealed cards for the defender (current player)
    const currentPlayerId = players[turnIndex].id;
    setPlayerRevealedCards(prev => ({
      ...prev,
      [currentPlayerId]: {} // Clear revealed cards for current player
    }));

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
    
    // Reset showdown result after a delay
    setTimeout(() => {
      setShowdownResult({ winnerId: null, loserId: null });
    }, 3000);
    
    setShowdownTime(3000);
  };

  const adjustChips = (id, delta) => {
    setPlayers(players.map(p =>
      p.id === id ? { ...p, chips: Math.max(p.chips + delta, 0) } : p
    ));
  };

  const handleRevealCard = (playerId, cardIndex) => {
    // Only allow current player to reveal their own cards
    if (players[turnIndex].id !== playerId) return;
    
    const player = players[turnIndex];
    const wasBlind = player.blind;
    
    // Set player as no longer blind when they see a card
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, blind: false } : p
    ));
    
    // If player was blind and is now seeing cards, check if previous player was blind
    if (wasBlind) {
      const prevPlayerIndex = getPreviousActivePlayerIndex(turnIndex);
      if (prevPlayerIndex !== null) {
        const prevPlayer = players[prevPlayerIndex];
        if (prevPlayer.blind) {
          // Previous player was blind, so current player's minimum bet should be doubled
          setMinBetAmount(minBetAmount * 2);
          setBetAmount(minBetAmount * 2);
        }
      }
    }
    
    setPlayerRevealedCards(prev => {
      const playerCards = prev[playerId] || {};
      return {
        ...prev,
        [playerId]: {
          ...playerCards,
          [cardIndex]: !playerCards[cardIndex] // Toggle the revealed state
        }
      };
    });
  };

  // Add a new function to handle revealing all cards
  const handleRevealAllCards = (playerId) => {
    // Only allow current player to reveal their own cards
    if (players[turnIndex].id !== playerId) return;
    
    const player = players[turnIndex];
    const wasBlind = player.blind;
    
    // Set player as no longer blind when they see their cards
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, blind: false } : p
    ));
    
    // If player was blind and is now seeing cards, check if previous player was blind
    if (wasBlind) {
      const prevPlayerIndex = getPreviousActivePlayerIndex(turnIndex);
      if (prevPlayerIndex !== null) {
        const prevPlayer = players[prevPlayerIndex];
        if (prevPlayer.blind) {
          // Previous player was blind, so current player's minimum bet should be doubled
          setMinBetAmount(minBetAmount * 2);
          setBetAmount(minBetAmount * 2);
        }
      }
    }
    
    const playerCards = players[turnIndex].cards;
    const allRevealed = {};
    
    // Check if all cards are already revealed
    const currentRevealed = playerRevealedCards[playerId] || {};
    const allAlreadyRevealed = playerCards.length > 0 && 
      playerCards.every((_, index) => currentRevealed[index]);
    
    // If all cards are already revealed, hide them all
    if (allAlreadyRevealed) {
      setPlayerRevealedCards(prev => ({
        ...prev,
        [playerId]: {}
      }));
      return;
    }
    
    // Otherwise, reveal all cards
    playerCards.forEach((_, index) => {
      allRevealed[index] = true;
    });
    
    setPlayerRevealedCards(prev => ({
      ...prev,
      [playerId]: allRevealed
    }));
  };

  return (
    <div className={styles.tableContainer}>
      <button 
        ref={toggleButtonRef}
        className={styles.sidebarToggle} 
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <FontAwesomeIcon icon={faGear} size='lg'/>
      </button>

      <div 
        ref={sidebarRef}
        className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}
      >
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
      <div className={styles.pot}>
        <FontAwesomeIcon icon={faCoins} className={styles.potIcon} size="lg" />
        <div>Pot: {pot}</div>
      </div>
      {!gameRunning && (
        <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
         <button onClick={startGame} className={styles.revealButton}>Start Game</button>
        </div>
        )}
      <div className={styles.tableCircle}>
        {players.map((p, i) => {
        const angle = (360 / players.length) * i;
        const radians = (angle * Math.PI) / 180;
        const radius = 300;
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;

        return (
        <div
            key={p.id}
            className={styles.playerSeat}
            style={{ top: `42%`, left: `37%`, transform: `translate(${x}px, ${y}px)` }}
        >
            <PlayerSeat
            player={{
              ...p,
              revealedCards: playerRevealedCards[p.id] || {}
            }}
            isTurn={i === turnIndex}
            adjustChips={adjustChips}
            revealedHands={revealedHands}
            onRevealCard={handleRevealCard}
            onRevealAllCards={handleRevealAllCards}
            showdownResult={showdownResult}
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
              {customSettings.allowBackShow && !players[turnIndex].blind && players.filter(p => !p.folded).length > 2 &&(
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
