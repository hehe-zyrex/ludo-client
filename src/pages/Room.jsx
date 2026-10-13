import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import LudoBoard from '../components/LudoBoard';

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onRoomUpdate = (r) => r && setRoom({ ...r });
    const onGameStarted = (r) => {
      setRoom({ ...r });
      setGameStarted(true);
    };

    socket.on('roomUpdate', onRoomUpdate);
    socket.on('gameStarted', onGameStarted);

    socket.emit('getRoom', { code }, (res) => {
      if (res?.room) {
        setRoom(res.room);
        if (res.room.status === 'playing') setGameStarted(true);
      } else {
        navigate('/');
      }
    });

    return () => {
      socket.off('roomUpdate', onRoomUpdate);
      socket.off('gameStarted', onGameStarted);
    };
  }, [code, navigate]);

  const startGame = () => {
    socket.emit('startGame', { roomCode: code }, (res) => {
      if (!res.success) alert(res.message);
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) return <div style={styles.loading}>Loading room…</div>;

  if (gameStarted) return <LudoBoard room={room} />;

  const isHost = socket.id === room.hostId;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Room Lobby</h2>

        <div style={styles.codeBox}>
          <div>
            <p style={styles.codeLabel}>Room Code</p>
            <p style={styles.codeText}>{room.code}</p>
          </div>
          <button onClick={copyCode} style={styles.copyBtn}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <p style={styles.hint}>Share this code with friends to let them join</p>

        <h3 style={styles.playersTitle}>
          Players ({room.players.length}/{room.maxPlayers})
        </h3>

        <div style={styles.playersList}>
          {room.players.map((p) => (
            <div key={p.id} style={styles.playerRow}>
              <div style={{ ...styles.colorDot, background: p.color }} />
              <span style={styles.playerName}>{p.name}</span>
              {p.socketId === room.hostId && (
                <span style={styles.hostTag}>Host</span>
              )}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={startGame}
            disabled={room.players.length < 2}
            style={{
              ...styles.startBtn,
              opacity: room.players.length < 2 ? 0.5 : 1,
            }}
          >
            {room.players.length < 2 ? 'Waiting for players…' : 'Start Game'}
          </button>
        ) : (
          <p style={styles.waiting}>Waiting for host to start…</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6b21a8',
  },
  codeBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f3e8ff',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 8,
  },
  codeLabel: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: 600,
    marginBottom: 2,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 4,
    color: '#6b21a8',
  },
  copyBtn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  playersTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 12,
    color: '#333',
  },
  playersList: { marginBottom: 24 },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid #fff',
    boxShadow: '0 0 0 2px #ddd',
  },
  playerName: { fontWeight: 600, flex: 1 },
  hostTag: {
    background: '#7c3aed',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
    textTransform: 'uppercase',
  },
  startBtn: {
    width: '100%',
    padding: 14,
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
  },
  waiting: { textAlign: 'center', color: '#666', padding: 12 },
};
