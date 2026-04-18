import type { Action, GameState, Piece, PieceType, Position } from './types';
import { PIECE_KANJI, SUJI_KANJI, DAN_KANJI } from './constants';
import { getPieceAt } from './board';
import { createGame, applyMove } from './game';

// ==========================================
// KIF形式
// ==========================================

export interface KifMetadata {
  startedAt?: Date;
  sente: string;
  gote: string;
  timeControl?: number;
  result?: string;
}

/**
 * 指し手をKIF形式の文字列に変換
 * 例: "７六歩", "同　銀成", "３四角打"
 */
export function moveToKif(
  action: Action,
  prevAction: Action | null,
  piece: Piece,
): string {
  const to = action.type === 'move' ? action.to : action.to;

  // 「同」の判定：前の手と同じ位置への移動
  const isSame = prevAction &&
    ((prevAction.type === 'move' && prevAction.to.suji === to.suji && prevAction.to.dan === to.dan) ||
     (prevAction.type === 'drop' && prevAction.to.suji === to.suji && prevAction.to.dan === to.dan));

  let posStr: string;
  if (isSame) {
    posStr = '同　';
  } else {
    posStr = SUJI_KANJI[to.suji] + DAN_KANJI[to.dan];
  }

  const pieceStr = PIECE_KANJI[piece.type];

  let suffix = '';
  if (action.type === 'move') {
    if (action.promote) {
      suffix = '成';
    }
    // 移動元の表記
    suffix += `(${action.from.suji}${action.from.dan})`;
  } else {
    suffix = '打';
  }

  return posStr + pieceStr + suffix;
}

/**
 * ゲーム全体をKIF形式に変換
 */
export function gameToKif(game: GameState, metadata: KifMetadata): string {
  const lines: string[] = [];

  // ヘッダ
  if (metadata.startedAt) {
    const d = metadata.startedAt;
    lines.push(`開始日時：${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`);
  }
  lines.push(`先手：${metadata.sente}`);
  lines.push(`後手：${metadata.gote}`);
  lines.push('手合割：平手');
  lines.push('');

  // 指し手を再生しながらKIF表記を生成
  let currentGame = createGame();
  let prevAction: Action | null = null;

  for (let i = 0; i < game.moveHistory.length; i++) {
    const action = game.moveHistory[i];
    const moveNum = i + 1;

    // 移動する駒を取得
    let piece: Piece;
    if (action.type === 'move') {
      const p = getPieceAt(currentGame.boardState, action.from);
      if (!p) break; // 理論上ありえないが安全策
      piece = p;
    } else {
      piece = { type: action.piece, owner: currentGame.teban };
    }

    const kifStr = moveToKif(action, prevAction, piece);
    const numStr = String(moveNum).padStart(4, ' ');
    lines.push(`${numStr} ${kifStr}`);

    // ゲーム進行
    const result = applyMove(currentGame, action);
    if (!result.success) break;
    currentGame = result.game;
    prevAction = action;
  }

  // 結果
  if (game.status.type === 'resign') {
    lines.push(`${String(game.moveHistory.length + 1).padStart(4, ' ')} 投了`);
  }

  lines.push('');

  // 結果行
  if (metadata.result) {
    lines.push(metadata.result);
  } else if (game.status.type === 'checkmate') {
    const winner = game.status.winner === 'sente' ? '先手' : '後手';
    lines.push(`まで${game.moveCount}手で${winner}の勝ち`);
  } else if (game.status.type === 'resign') {
    const winner = game.status.winner === 'sente' ? '先手' : '後手';
    lines.push(`まで${game.moveCount}手で${winner}の勝ち`);
  } else if (game.status.type === 'draw') {
    if (game.status.reason === 'sennichite') {
      lines.push(`まで${game.moveCount}手で千日手`);
    } else {
      lines.push(`まで${game.moveCount}手で持将棋`);
    }
  }

  return lines.join('\n');
}

/** KIF形式の筋表記を数値に変換 */
const SUJI_MAP: Record<string, number> = {
  '１': 1, '２': 2, '３': 3, '４': 4, '５': 5,
  '６': 6, '７': 7, '８': 8, '９': 9,
};

/** KIF形式の段表記を数値に変換 */
const DAN_MAP: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9,
};

/** 漢字→駒種の逆引き */
const KANJI_TO_PIECE: Record<string, PieceType> = {};
for (const [type, kanji] of Object.entries(PIECE_KANJI)) {
  KANJI_TO_PIECE[kanji] = type as PieceType;
}

/**
 * KIF形式の文字列をパースしてAction配列に変換
 * 簡易実装（基本的なKIF形式のみ対応）
 */
export function parseKif(kif: string): { metadata: KifMetadata; moves: Action[] } {
  const lines = kif.split('\n');
  const metadata: KifMetadata = { sente: '', gote: '' };
  const moves: Action[] = [];
  let prevTo: Position | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // ヘッダ解析
    if (trimmed.startsWith('先手：')) {
      metadata.sente = trimmed.slice(3);
      continue;
    }
    if (trimmed.startsWith('後手：')) {
      metadata.gote = trimmed.slice(3);
      continue;
    }

    // 指し手行: "   1 ７六歩(77)"
    const moveMatch = trimmed.match(/^\s*\d+\s+(.+)$/);
    if (!moveMatch) continue;

    const moveStr = moveMatch[1];
    if (moveStr === '投了' || moveStr === '中断') break;

    // パース（簡易）
    const parsed = parseKifMove(moveStr, prevTo);
    if (parsed) {
      moves.push(parsed.action);
      prevTo = parsed.to;
    }
  }

  return { metadata, moves };
}

function parseKifMove(
  moveStr: string,
  prevTo: Position | null,
): { action: Action; to: Position } | null {
  let pos = 0;
  let to: Position;

  // 「同」チェック
  if (moveStr.startsWith('同')) {
    if (!prevTo) return null;
    to = prevTo;
    pos = moveStr[1] === '　' ? 2 : 1;
  } else {
    const sujiChar = moveStr[0];
    const danChar = moveStr[1];
    const suji = SUJI_MAP[sujiChar];
    const dan = DAN_MAP[danChar];
    if (!suji || !dan) return null;
    to = { suji, dan };
    pos = 2;
  }

  // 駒種
  let pieceStr = moveStr[pos];
  // 成銀・成桂・成香の場合は2文字
  if (pieceStr === '成') {
    pieceStr = moveStr.slice(pos, pos + 2);
    pos += 2;
  } else {
    pos += 1;
  }

  // 「打」の判定
  if (moveStr[pos] === '打') {
    const pieceType = KANJI_TO_PIECE[pieceStr];
    if (!pieceType) return null;
    return { action: { type: 'drop', piece: pieceType as any, to }, to };
  }

  // 「成」の判定
  const promote = moveStr[pos] === '成';
  if (promote) pos++;

  // 移動元 "(77)" の解析
  const fromMatch = moveStr.slice(pos).match(/\((\d)(\d)\)/);
  if (!fromMatch) return null;
  const from: Position = { suji: parseInt(fromMatch[1]), dan: parseInt(fromMatch[2]) };

  return {
    action: { type: 'move', from, to, promote },
    to,
  };
}
