import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

export default function Home() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ensureConnected = () =>
    new Promise((resolve) => {
      if (socket.connected) return resolve();
      socket.connect();
      socket.once('connect', () => resolve());
    });

  const handleCreate = async () => {
    if (!name.trim()) return setError('Please enter your name');
    setError('');
    setLoading(true);
    await ensureConnected();

    socket.emit('createRoom', { playerName: name.trim(), maxPlayers }, (res) => {
      setLoading(false);
      if (res.success) {
        localStorage.setItem('playerName', name.trim());
        navigate(`/room/${res.room.code}`);
      } else {
        setError(res.message || 'Failed to create room');
      }
    });
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError('Please enter your name');
    if (!roomCode.trim()) return setError('Please enter room code');
    setError('');
    setLoading(true);
    await ensureConnected();

    socket.emit(
      'joinRoom',
      { roomCode: roomCode.trim().toUpperCase(), playerName: name.trim() },
      (res) => {
        setLoading(false);
        if (res.success) {
          localStorage.setItem('playerName', name.trim());
          navigate(`/room/${roomCode.trim().toUpperCase()}`);
        } else {
          setError(res.message || 'Failed to join room');
        }
      }
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎲 Ludo Online</h1>
        <p style={styles.subtitle}>Play with friends, anytime</p>

        <input
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          maxLength={20}
        />

        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Max Players</label>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            style={styles.input}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} Players
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          style={{ ...styles.button, ...styles.primary }}
        >
          {loading ? 'Please wait...' : 'Create Room'}
        </button>

        <div style={styles.divider}>
          <hr style={styles.hr} />
          <span style={styles.orText}>OR</span>
          <hr style={styles.hr} />
        </div>

        <input
          placeholder="Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: 2 }}
          maxLength={6}
        />

        <button
          onClick={handleJoin}
          disabled={loading}
          style={{ ...styles.button, ...styles.secondary }}
        >
          {loading ? 'Please wait...' : 'Join Room'}
        </button>

        {error && <p style={styles.error}>{error}</p>}
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
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    textAlign: 'center',
    color: '#6b21a8',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 15,
    outline: 'none',
    marginBottom: 12,
  },
  button: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    marginTop: 4,
  },
  primary: { background: '#7c3aed' },
  secondary: { background: '#2563eb' },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
  },
  hr: { flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' },
  orText: { color: '#999', fontSize: 12, fontWeight: 600 },
  error: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 14,
  },
};
