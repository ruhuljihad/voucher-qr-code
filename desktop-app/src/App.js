
import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from './config';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [voucherTaken, setVoucherTaken] = useState(false);

  useEffect(() => {
    // Create session on mount
    fetch(`${BACKEND_URL}/api/session`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setSessionId(data.sessionId);
        // Register desktop with backend
        const socket = io(BACKEND_URL);
        socket.emit('register-desktop', data.sessionId);
        socket.on('voucher-taken', () => {
          setVoucherTaken(true);
        });
      });
  }, []);

  return (
    <div className="main-container">
      <h2>Voucher Session</h2>
      {sessionId && (
        <div className="qr-box">
          <QRCodeCanvas value={sessionId} size={256} />
          <p>Scan this QR code with your mobile app</p>
        </div>
      )}
      {voucherTaken && <div className="success-message">Voucher has been taken!</div>}
    </div>
  );
}

export default App;
