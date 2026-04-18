'use client';

interface TimeDisplayProps {
  remainingMs: number;
  isActive: boolean;
}

export function TimeDisplay({ remainingMs, isActive }: TimeDisplayProps) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds <= 60;
  const isCritical = totalSeconds <= 10;

  return (
    <span
      className={`
        font-mono text-lg font-bold tabular-nums
        ${isActive ? 'text-[#D4A017]' : 'text-[#F0E6D3]/30'}
        ${isLow && isActive ? 'text-[#C41E3A]' : ''}
        ${isCritical && isActive ? 'animate-pulse' : ''}
      `}
    >
      {minutes}:{String(seconds).padStart(2, '0')}
    </span>
  );
}
