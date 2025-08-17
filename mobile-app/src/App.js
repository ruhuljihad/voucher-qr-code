
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { io } from 'socket.io-client';
import { BACKEND_URL } from './config';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [vouchers, setVouchers] = useState([]);
  const [scanned, setScanned] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    let html5QrCode;
    let isMounted = true;

    if (!scanned && qrRef.current) {
      html5QrCode = new Html5Qrcode(qrRef.current.id);
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (isMounted) {
            setSessionId(decodedText);
            setScanned(true);
            html5QrCode.stop().catch(() => {});
          }
        },
        () => {}
      );
    }

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.getState && html5QrCode.getState() === 2) { // 2 = SCANNING
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [scanned]);

  useEffect(() => {
    if (sessionId) {
      const socket = io(BACKEND_URL);
      socket.emit('scan-qr', { sessionId });
      socket.on('voucher-list', (data) => {
        setVouchers(data);
      });
    }
  }, [sessionId]);

  return (
    <div className="main-container">
      <h2>Scan QR to Get Vouchers</h2>
      {!scanned && <div id="qr-reader" ref={qrRef} style={{ width: 300, height: 300 }} />}
      {scanned && (
        <>
          <div style={{ margin: '20px 0' }}>Session ID: {sessionId}</div>
          <div className="voucher-list">
            <h3 style={{ marginTop: 0 }}>Vouchers:</h3>
            <ul>
              {vouchers.map((v, i) => (
                <li key={i}>
                  <b>{v.username}</b>: {v.password}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
