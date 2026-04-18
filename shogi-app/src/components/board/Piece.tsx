'use client';

import type { PieceType, Player } from '@/lib/shogi/core/types';
import { isPromoted } from '@/lib/shogi/core/constants';

interface PieceProps {
  type: PieceType;
  owner: Player;
  perspective: Player;
  isSelected?: boolean;
}

/**
 * 駒の表示テキスト（参考画像準拠）
 * 通常駒: 2文字漢字（上段・下段）
 * 成駒: 赤字
 */
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
  // 相手側の駒を180度回転する（自分側は正立）
  const shouldRotate = owner !== perspective;
  const textColor = isNari ? '#B22222' : '#1A1000';
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
        className="w-[92%] h-[92%] drop-shadow-md"
        style={{ filter: isSelected ? 'drop-shadow(0 0 4px rgba(43,76,126,0.6))' : undefined }}
      >
        <defs>
          {/* 木目グラデーション */}
          <linearGradient id={`wood-${type}-${owner}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8C878" />
            <stop offset="25%" stopColor="#DCBA62" />
            <stop offset="50%" stopColor="#E5C56E" />
            <stop offset="75%" stopColor="#D4AD55" />
            <stop offset="100%" stopColor="#C9A04A" />
          </linearGradient>
          {/* 駒の影 */}
          <filter id="pieceInnerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0.5" dy="1" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feFlood floodColor="#8B6914" floodOpacity="0.15" />
            <feComposite in2="SourceGraphic" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={shouldRotate ? 'rotate(180 50 56)' : ''}>
          {/* 駒の五角形（本体） */}
          <polygon
            points="50,4 94,28 86,108 14,108 6,28"
            fill={`url(#wood-${type}-${owner})`}
            stroke="#8B7355"
            strokeWidth="1.5"
            filter="url(#pieceInnerShadow)"
          />

          {/* 木目テクスチャライン */}
          <line x1="20" y1="35" x2="22" y2="100" stroke="#C9A04A" strokeWidth="0.3" opacity="0.4" />
          <line x1="40" y1="15" x2="38" y2="105" stroke="#C9A04A" strokeWidth="0.3" opacity="0.3" />
          <line x1="60" y1="12" x2="62" y2="105" stroke="#C9A04A" strokeWidth="0.3" opacity="0.35" />
          <line x1="78" y1="30" x2="76" y2="100" stroke="#C9A04A" strokeWidth="0.3" opacity="0.3" />

          {/* 駒のフチ（内側の線） */}
          <polygon
            points="50,8 90,30 83,105 17,105 10,30"
            fill="none"
            stroke="#B8972E"
            strokeWidth="0.5"
            opacity="0.3"
          />

          {/* 文字 */}
          {isSingleChar ? (
            /* 1文字（と、全など） */
            <text
              x="50"
              y="66"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={textColor}
              fontSize="42"
              fontWeight="900"
              fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif"
              style={{ paintOrder: 'stroke', stroke: textColor, strokeWidth: 0.5 }}
            >
              {display.top}
            </text>
          ) : (
            /* 2文字（上段・下段） */
            <>
              <text
                x="50"
                y="44"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize="34"
                fontWeight="900"
                fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif"
                style={{ paintOrder: 'stroke', stroke: textColor, strokeWidth: 0.3 }}
              >
                {display.top}
              </text>
              <text
                x="50"
                y="82"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize="34"
                fontWeight="900"
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
