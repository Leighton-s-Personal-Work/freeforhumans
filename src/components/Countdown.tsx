'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  expiresAt: number; // Unix timestamp in seconds
}

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

export function Countdown({ expiresAt }: CountdownProps) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = expiresAt - now;

  if (remaining <= 0) {
    return <span className="font-mono text-lg font-semibold text-gray-800">Ended</span>;
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <span className="font-mono tabular-nums text-lg font-semibold text-gray-800">
      {days > 0 && <>{days}d </>}
      {padZero(hours)}:{padZero(minutes)}:{padZero(seconds)}
    </span>
  );
}
