// utils/pokerUtils.js

// Global toggles for custom rules
export let customRules = {
    enableSpecial235: true,       // Enables "Special 2-3-5" hand: beats all straights, loses to flushes
    enableSuited235: true,        // Enables "Suited 2-3-5" hand: beats straight flushes, loses to trips
    showLoserOnTie: true,         // Back-show requester loses if there's a tie
    allowBackShow: true,          // Allows back-showing
    };
    
    export function setCustomRules(newRules) {
    customRules = { ...customRules, ...newRules };
    }
    
    export function evaluateHand(cards) {
    const suits = cards.map(c => c.slice(-1));
    const values = cards.map(c => c.slice(0, -1));
    
    const counts = {};
    for (let v of values) counts[v] = (counts[v] || 0) + 1;
    
    const isFlush = suits.every(s => s === suits[0]);
    const uniqueValues = Object.keys(counts).length;
    
    const has235 = values.includes('2') && values.includes('3') && values.includes('5');
    const isSuited235 = has235 && isFlush;
    
    // Custom hand type: suited 2-3-5 beats all except trips
    if (customRules.enableSuited235 && isSuited235) return 'Suited 2-3-5';
    // Custom hand type: 2-3-5 beats all straights but not flushes
    if (customRules.enableSpecial235 && has235) return 'Special 2-3-5';
    
    if (isFlush && isStraight(values)) return 'Straight Flush';
    if (Object.values(counts).includes(3)) return 'Three of a Kind';
    if (uniqueValues === 2) return 'Pair';
    if (isFlush) return 'Flush';
    if (isStraight(values)) return 'Straight';
    
    return 'High Card';
    }
    
    function isStraight(values) {
    // Custom straight order for tie-breaking
    const straightOrder = [
    ['A', 'K', 'Q'],
    ['A', '2', '3'],
    ['K', 'Q', 'J'],
    ['Q', 'J', '10'],
    ['J', '10', '9'],
    ['10', '9', '8'],
    ['9', '8', '7'],
    ['8', '7', '6'],
    ['7', '6', '5'],
    ['6', '5', '4'],
    ['5', '4', '3'],
    ['4', '3', '2']
    ];
    
    return straightOrder.some(order => order.every(v => values.includes(v)));
    }
    
    function getStraightStrength(values) {
    // Ranking of straights for custom tie-breaking
    const straightOrder = [
    ['A', 'K', 'Q'],
    ['A', '2', '3'],
    ['K', 'Q', 'J'],
    ['Q', 'J', '10'],
    ['J', '10', '9'],
    ['10', '9', '8'],
    ['9', '8', '7'],
    ['8', '7', '6'],
    ['7', '6', '5'],
    ['6', '5', '4'],
    ['5', '4', '3'],
    ['4', '3', '2']
    ];
    
    for (let i = 0; i < straightOrder.length; i++) {
    if (straightOrder[i].every(v => values.includes(v))) {
    return straightOrder.length - i; // Higher index = lower strength
    }
    }
    return 0;
    }
    
    function getSortedCardRanks(cards) {
    const order = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    return cards
    .map(c => c.slice(0, -1))
    .map(v => order.indexOf(v))
    .sort((a, b) => b - a);
    }
    
    function getPairStrength(cards) {
    const order = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const values = cards.map(c => c.slice(0, -1));
    const counts = {};
    for (let v of values) counts[v] = (counts[v] || 0) + 1;
    
    let pairValue = null;
    let kicker = null;
    for (let v in counts) {
    if (counts[v] === 2) pairValue = order.indexOf(v);
    if (counts[v] === 1) kicker = order.indexOf(v);
    }
    
    return { pairValue, kicker };
    }
    
    export function compareHands(a, b, aId = null, bId = null) {
    const ranks = [
    'High Card',
    'Pair',
    'Flush',
    'Straight',
    'Special 2-3-5', // Custom ranking
    'Straight Flush',
    'Suited 2-3-5',   // Custom ranking
    'Three of a Kind'
    ];
    
    const rankA = evaluateHand(a);
    const rankB = evaluateHand(b);
    const ra = ranks.indexOf(rankA);
    const rb = ranks.indexOf(rankB);
    
    if (ra > rb) return 1;
    if (ra < rb) return -1;
    
    // Tie-breaker for Pairs
    if (rankA === 'Pair' && rankB === 'Pair') {
    const { pairValue: pvA, kicker: kA } = getPairStrength(a);
    const { pairValue: pvB, kicker: kB } = getPairStrength(b);
    if (pvA > pvB) return 1;
    if (pvA < pvB) return -1;
    if (kA > kB) return 1;
    if (kA < kB) return -1;
    }
    
    // Tie-breaker for Straights using custom strength order
    if (rankA === 'Straight' && rankB === 'Straight') {
    const strengthA = getStraightStrength(a.map(c => c.slice(0, -1)));
    const strengthB = getStraightStrength(b.map(c => c.slice(0, -1)));
    if (strengthA > strengthB) return 1;
    if (strengthA < strengthB) return -1;
    }
    
    // Tie-breaker for Flushes using high card logic
    if (rankA === 'Flush' && rankB === 'Flush') {
    const aRanks = getSortedCardRanks(a);
    const bRanks = getSortedCardRanks(b);
    for (let i = 0; i < aRanks.length; i++) {
    if (aRanks[i] > bRanks[i]) return 1;
    if (aRanks[i] < bRanks[i]) return -1;
    }
    }
    
    // General high-card tie-breaker for remaining ties
    const aRanks = getSortedCardRanks(a);
    const bRanks = getSortedCardRanks(b);
    for (let i = 0; i < aRanks.length; i++) {
    if (aRanks[i] > bRanks[i]) return 1;
    if (aRanks[i] < bRanks[i]) return -1;
    }
    
    // Custom rule: if still tied, player who requested show loses
    if (customRules.showLoserOnTie && aId !== null && bId !== null) {
    return -1; // a is requester, loses on tie
    }
    return 0;
    }
        