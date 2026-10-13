import { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function LudoBoard({ room }) {
  const [gameState, setGameState] = useState(room.gameState);
  const [diceValue, setDiceValue] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [winner, setWinner] = useState(null);

  const myPlayerId = room.players.find((p) => p.socketId === socket.id)?.id;
  const isMyTurn = gameState?.currentTurn === myPlayerId;

  useEffect(() => {
    const onDiceRolled = ({ playerId, diceValue, validMoves }) => {
      setDiceValue(diceValue);
      setRolling(false);
      if (playerId === myPlayerId) setValidMoves(validMoves);
    };

    const onTokenMoved = ({ gameState, captured }) => {
      setGameState({ ...gameState });
      setValidMoves([]);
      setDiceValue(null);
      if (captured?.length) {
        setMessages((prev) => [...prev, '💥 A token was captured!']);
      }
    };

    const onGameOver = ({ playerName }) => setWinner(playerName);
    const onChat = (msg) =>
      setMessages((prev) => [...prev, `${msg.name}: ${msg.message}`]);

    socket.on('diceRolled', onDiceRolled);
    socket.on('tokenMoved', onTokenMoved);
    socket.on('gameOver', onGameOver);
    socket.on('chatMessage', onChat);

    return () => {
      socket.off('diceRolled', onDiceRolled);
      socket.off('tokenMoved', onTokenMoved);
      socket.off('gameOver', onGameOver);
      socket.off('chatMessage', onChat);
    };
  }, [myPlayerId]);

  const rollDice = () => {
    if (!isMyTurn || rolling) return;
    setRolling(true);
    socket.emit('rollDice', { roomCode: room.code });
  };

  const moveToken = (tokenIndex) => {
    if (!isMyTurn) return;
    socket.emit('moveToken', { roomCode: room.code, tokenIndex }, (res) => {
      if (!res.success) alert(res.message);
    });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('chatMessage', { roomCode: room.code, message: chatInput });
    setChatInput('');
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <div style={styles.boardArea}>
          <h2 style={styles.turnText}>
            Current Turn:{' '}
            <span style={{ color: '#a78bfa' }}>
              {gameState?.players.find((p) => p.id === gameState.currentTurn)?.name}
            </span>
          </h2>

          <div style={styles.board}>
            {gameState?.players.map((p) => (
              <div key={p.id} style={styles.playerBoardRow}>
                <div style={{ ...styles.colorDot, background: p.color }} />
                <strong style={{ minWidth: 80 }}>{p.name}</strong>
                <span style={{ fontSize: 13, color: '#aaa' }}>
                  Tokens:{' '}
                  {p.tokens
                    .map((t) => (t === -1 ? '🏠' : t === 57 ? '✅' : t))
                    .join(' | ')}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.diceArea}>
            <button
              onClick={rollDice}
              disabled={!isMyTurn || rolling || gameState?.hasRolled}
              style={{
                ...styles.diceBtn,
                opacity: !isMyTurn || rolling ? 0.5 : 1,
              }}
            >
              {rolling ? '…' : diceValue || '🎲'}
            </button>
            <div style={{ marginLeft: 16 }}>
              {isMyTurn ? (
                <p style={{ color: '#4ade80', fontWeight: 700 }}>YOUR TURN</p>
              ) : (
                <p style={{ color: '#aaa' }}>Waiting…</p>
              )}
            </div>
          </div>

          {validMoves.length > 0 && (
            <div style={styles.moves}>
              <p style={{ marginBottom: 8, fontWeight: 700 }}>
                Click a token to move:
              </p>
              {validMoves.map((m) => (
                <button
                  key={m.tokenIndex}
                  onClick={() => moveToken(m.tokenIndex)}
                  style={styles.moveBtn}
                >
                  Token {m.tokenIndex + 1} → {m.to === 57 ? 'Home' : m.to}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.sidebar}>
          <h3 style={{ marginBottom: 12, color: '#fff' }}>Chat</h3>
          <div style={styles.chatBox}>
            {messages.map((m, i) => (
              <p key={i} style={styles.chatMsg}>
                {m}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Message…"
              style={styles.chatInput}
            />
            <button onClick={sendChat} style={styles.sendBtn}>
              Send
            </button>
          </div>
        </div>
      </div>

      {winner && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>🏆 {winner} Wins!</h2>
            <button
              onClick={() => (window.location.href = '/')}
              style={styles.primaryBtn}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#111827',
    padding: 16,
    color: '#fff',
  },
  layout: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 16,
  },
  boardArea: { background: '#1f2937', borderRadius: 16, padding: 20 },
  turnText: { marginBottom: 16, fontSize: 18 },
  board: { background: '#374151', borderRadius: 12, padding: 16, marginBottom: 16 },
  playerBoardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px solid #4b5563',
  },
  colorDot: { width: 16, height: 16, borderRadius: '50%' },
  diceArea: { display: 'flex', alignItems: 'center', marginBottom: 16 },
  diceBtn: {
    width: 80,
    height: 80,
    fontSize: 32,
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontWeight: 700,
  },
  moves: { background: '#374151', padding: 12, borderRadius: 10 },
  moveBtn: {
    display: 'block',
    width: '100%',
    padding: 10,
    marginBottom: 6,
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    textAlign: 'left',
  },
  sidebar: { background: '#1f2937', borderRadius: 16, padding: 20 },
  chatBox: {
    height: 300,
    overflowY: 'auto',
    background: '#374151',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  chatMsg: { fontSize: 13, marginBottom: 4 },
  chatInput: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: 'none',
    background: '#374151',
    color: '#fff',
  },
  sendBtn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    fontWeight: 600,
  },
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    background: '#fff',
    color: '#111',
    padding: 32,
    borderRadius: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 16,
  },
};
