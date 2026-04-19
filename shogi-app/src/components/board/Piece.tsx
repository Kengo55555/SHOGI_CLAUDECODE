'use client';

import type { PieceType, Player } from '@/lib/shogi/core/types';
import { isPromoted } from '@/lib/shogi/core/constants';

interface PieceProps {
  type: PieceType;
  owner: Player;
  perspective: Player;
  isSelected?: boolean;
}

const PIECE_DISPLAY: Record<PieceType, { top: string; bottom: string }> = {
  ou:      { top: '王', bottom: '将' },
  gyoku:   { top: '玉', bottom: '将' },
  hisha:   { top: '飛', bottom: '車' },
  kaku:    { top: '角', bottom: '行' },
  kin:     { top: '金', bottom: '将' },
  gin:     { top: '銀', bottom: '将' },
  kei:     { top: '桂', bottom: '馬' },
  kyou:    { top: '香', bottom: '車' },
  fu:      { top: '歩', bottom: '兵' },
  ryuu:    { top: '龍', bottom: '王' },
  uma:     { top: '龍', bottom: '馬' },
  narigin: { top: '全', bottom: '' },
  narikei: { top: '全', bottom: '' },
  narikyou:{ top: '全', bottom: '' },
  tokin:   { top: 'と', bottom: '' },
};

export function PieceComponent({ type, owner, perspective, isSelected }: PieceProps) {
  const display = PIECE_DISPLAY[type];
  const isNari = isPromoted(type);
  const shouldRotate = owner !== perspective;
  // 遊郭テーマ：成駒は紅、通常駒は濃墨
  const textColor = isNari ? '#C4364A' : '#1A0607';
  const isSingleChar = !display.bottom;

  return (
    <div
      className={`
        relative w-full h-full flex items-center justify-center select-none
        ${isSelected ? 'scale-110 z-10' : ''}
        transition-transform duration-100
      `}
    >
      <svg
        viewBox="0 0 100 112"
        className="w-[94%] h-[94%] drop-shadow-md"
        style={{
          filter: isSelected
            ? 'drop-shadow(0 0 6px #F0CF6A) drop-shadow(0 0 2px #D4A017)'
            : undefined,
        }}
      >
        <defs>
          {/* 金箔調木目グラデ */}
          <linearGradient id={`wood-${type}-${owner}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#F5DBA0" />
            <stop offset="30%" stopColor="#E8C878" />
            <stop offset="60%" stopColor="#D9A866" />
            <stop offset="100%" stopColor="#A6743A" />
          </linearGradient>
          <filter id="pieceInnerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0.5" dy="1" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feFlood floodColor="#8B6914" floodOpacity="0.2" />
            <feComposite in2="SourceGraphic" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={shouldRotate ? 'rotate(180 50 56)' : ''}>
          {/* 五角形本体 */}
          <polygon
            points="50,4 94,28 86,108 14,108 6,28"
            fill={`url(#wood-${type}-${owner})`}
            stroke="#7A5E22"
            strokeWidth="1.5"
            filter="url(#pieceInnerShadow)"
          />
          {/* 金フチ */}
          <polygon
            points="50,8 90,30 83,105 17,105 10,30"
            fill="none"
            stroke="#D4A017"
            strokeWidth="0.6"
            opacity="0.5"
          />
          {/* 木目テクスチャ */}
          <line x1="20" y1="35" x2="22" y2="100" stroke="#B8972E" strokeWidth="0.3" opacity=".4" />
          <line x1="40" y1="15" x2="38" y2="105" stroke="#B8972E" strokeWidth="0.3" opacity=".3" />
          <line x1="60" y1="12" x2="62" y2="105" stroke="#B8972E" strokeWidth="0.3" opacity=".35" />
          <line x1="78" y1="30" x2="76" y2="100" stroke="#B8972E" strokeWidth="0.3" opacity=".3" />

          {/* 文字 */}
          {isSingleChar ? (
            <text
              x="50" y="66" textAnchor="middle" dominantBaseline="middle"
              fill={textColor} fontSize="46" fontWeight="900"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif"
              style={{ paintOrder: 'stroke', stroke: textColor, strokeWidth: 0.5 }}
            >
              {display.top}
            </text>
          ) : (
            <>
              <text
                x="50" y="44" textAnchor="middle" dominantBaseline="middle"
                fill={textColor} fontSize="38" fontWeight="900"
                fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif"
                style={{ paintOrder: 'stroke', stroke: textColor, strokeWidth: 0.3 }}
              >
                {display.top}
              </text>
              <text
                x="50" y="84" textAnchor="middle" dominantBaseline="middle"
                fill={textColor} fontSize="38" fontWeight="900"
                fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif"
                style={{ paintOrder: 'stroke', stroke: textColor, strokeWidth: 0.3 }}
              >
                {display.bottom}
              </text>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
