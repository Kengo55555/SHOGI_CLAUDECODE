import type {
  BoardState, Position, Player, Piece, KomaType, PieceType,
  Action, MoveAction, DropAction, GameState, FoulType,
} from './types';
import { PIECE_MOVES, PROMOTION_MAP, isPromoted, demote } from './constants';
import {
  getPieceAt, setPieceAt, addMochigoma, removeMochigoma,
  findOu, isValidPosition, opponent, cloneBoard,
} from './board';

// ==========================================
// 移動候補生成（疑似合法手）
// ==========================================

/**
 * 駒の移動候補を生成（王手放置チェック前）
 * 先手は dy が負方向が「前」、後手は dy が正方向が「前」
 */
export function generatePseudoMoves(state: BoardState, player: Player): MoveAction[] {
  const moves: MoveAction[] = [];

  for (let dan = 1; dan <= 9; dan++) {
    for (let suji = 1; suji <= 9; suji++) {
      const piece = getPieceAt(state, { suji, dan });
      if (!piece || piece.owner !== player) continue;

      const directions = PIECE_MOVES[piece.type];
      const dirMul = player === 'sente' ? 1 : -1;

      for (const dir of directions) {
        const dx = dir.dx * dirMul;
        const dy = dir.dy * dirMul;

        if (dir.range) {
          // 走り駒：障害物に当たるまで進む
          let ns = suji + dx;
          let nd = dan + dy;
          while (isValidPosition({ suji: ns, dan: nd })) {
            const target = getPieceAt(state, { suji: ns, dan: nd });
            if (target && target.owner === player) break; // 味方の駒
            addMoveWithPromotion(moves, piece, { suji, dan }, { suji: ns, dan: nd }, player);
            if (target) break; // 相手の駒を取ったら止まる
            ns += dx;
            nd += dy;
          }
        } else {
          // 1マス移動（桂馬含む）
          const ns = suji + dx;
          const nd = dan + dy;
          if (!isValidPosition({ suji: ns, dan: nd })) continue;
          const target = getPieceAt(state, { suji: ns, dan: nd });
          if (target && target.owner === player) continue; // 味方の駒
          addMoveWithPromotion(moves, piece, { suji, dan }, { suji: ns, dan: nd }, player);
        }
      }
    }
  }

  return moves;
}

/** 成りの可能性を考慮して移動を追加 */
function addMoveWithPromotion(
  moves: MoveAction[],
  piece: Piece,
  from: Position,
  to: Position,
  player: Player,
): void {
  const ps = promotionStatus(piece, from, to);

  if (ps === 'must') {
    // 強制成り
    moves.push({ type: 'move', from, to, promote: true });
  } else if (ps === 'can') {
    // 成りも不成も可能
    moves.push({ type: 'move', from, to, promote: true });
    moves.push({ type: 'move', from, to, promote: false });
  } else {
    // 成れない
    moves.push({ type: 'move', from, to, promote: false });
  }
}

/**
 * 打ち手の候補を生成（禁じ手チェック付き）
 */
export function generatePseudoDrops(state: BoardState, player: Player): DropAction[] {
  const drops: DropAction[] = [];
  const mochi = player === 'sente' ? state.senteMochigoma : state.goteMochigoma;

  for (const [pieceType, count] of Object.entries(mochi)) {
    if (!count || count <= 0) continue;
    const koma = pieceType as KomaType;

    for (let dan = 1; dan <= 9; dan++) {
      for (let suji = 1; suji <= 9; suji++) {
        const pos = { suji, dan };
        if (getPieceAt(state, pos) !== null) continue; // 空きマスのみ

        // 行き所のない駒チェック
        if (hasNoLegalSquare(koma, pos, player)) continue;

        // 二歩チェック
        if (koma === 'fu' && isNifu(state, suji, player)) continue;

        drops.push({ type: 'drop', piece: koma, to: pos });
      }
    }
  }

  return drops;
}

// ==========================================
// 合法手生成
// ==========================================

/**
 * 全合法手を生成（王手放置・打ち歩詰めを除外）
 */
export function generateLegalMoves(game: GameState): Action[] {
  const { boardState, teban } = game;
  const pseudoMoves = generatePseudoMoves(boardState, teban);
  const pseudoDrops = generatePseudoDrops(boardState, teban);
  const legal: Action[] = [];

  for (const move of pseudoMoves) {
    if (!wouldBeInCheck(boardState, move, teban)) {
      legal.push(move);
    }
  }

  for (const drop of pseudoDrops) {
    if (!wouldBeInCheck(boardState, drop, teban)) {
      // 打ち歩詰めチェック
      if (drop.piece === 'fu' && isUchifuzume(boardState, drop.to, teban)) {
        continue;
      }
      legal.push(drop);
    }
  }

  return legal;
}

// ==========================================
// 合法性チェック
// ==========================================

/**
 * 指し手が合法かどうかを判定
 */
export function validateMove(
  game: GameState,
  action: Action
): { legal: true } | { legal: false; reason: FoulType | 'invalid' } {
  const legal = generateLegalMoves(game);
  const isLegal = legal.some(m => actionsEqual(m, action));

  if (isLegal) return { legal: true };

  // 理由を特定
  if (action.type === 'drop' && action.piece === 'fu') {
    if (isNifu(game.boardState, action.to.suji, game.teban)) {
      return { legal: false, reason: 'nifu' };
    }
    if (isUchifuzume(game.boardState, action.to, game.teban)) {
      return { legal: false, reason: 'uchifuzume' };
    }
  }
  if (action.type === 'drop' && hasNoLegalSquare(action.piece, action.to, game.teban)) {
    return { legal: false, reason: 'ikinokori_nashi' };
  }

  // 王手放置チェック
  if (wouldBeInCheck(game.boardState, action, game.teban)) {
    return { legal: false, reason: 'oute_hochi' };
  }

  return { legal: false, reason: 'invalid' };
}

/** 2つのActionが等しいか比較 */
function actionsEqual(a: Action, b: Action): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'move' && b.type === 'move') {
    return a.from.suji === b.from.suji && a.from.dan === b.from.dan &&
           a.to.suji === b.to.suji && a.to.dan === b.to.dan &&
           a.promote === b.promote;
  }
  if (a.type === 'drop' && b.type === 'drop') {
    return a.piece === b.piece && a.to.suji === b.to.suji && a.to.dan === b.to.dan;
  }
  return false;
}

// ==========================================
// ルール判定関数
// ==========================================

/** 王手されているか */
export function isInCheck(state: BoardState, player: Player): boolean {
  const ouPos = findOu(state, player);
  if (!ouPos) return false;
  return isAttackedBy(state, ouPos, opponent(player));
}

/** 指定マスが相手に攻撃されているか */
export function isAttackedBy(state: BoardState, pos: Position, attacker: Player): boolean {
  // 全駒種の動きを逆引きで確認
  for (let dan = 1; dan <= 9; dan++) {
    for (let suji = 1; suji <= 9; suji++) {
      const piece = getPieceAt(state, { suji, dan });
      if (!piece || piece.owner !== attacker) continue;

      if (canReach(state, { suji, dan }, pos, piece, attacker)) {
        return true;
      }
    }
  }
  return false;
}

/** 駒がfromからtoに到達可能か */
function canReach(state: BoardState, from: Position, to: Position, piece: Piece, player: Player): boolean {
  const directions = PIECE_MOVES[piece.type];
  const dirMul = player === 'sente' ? 1 : -1;

  for (const dir of directions) {
    const dx = dir.dx * dirMul;
    const dy = dir.dy * dirMul;

    if (dir.range) {
      let ns = from.suji + dx;
      let nd = from.dan + dy;
      while (isValidPosition({ suji: ns, dan: nd })) {
        if (ns === to.suji && nd === to.dan) return true;
        if (getPieceAt(state, { suji: ns, dan: nd })) break;
        ns += dx;
        nd += dy;
      }
    } else {
      if (from.suji + dx === to.suji && from.dan + dy === to.dan) return true;
    }
  }
  return false;
}

/** 指し手を適用した結果、自玉が王手されるか（自殺手判定） */
export function wouldBeInCheck(state: BoardState, action: Action, player: Player): boolean {
  const newState = applyActionToBoard(state, action, player);
  return isInCheck(newState, player);
}

/** 盤面に指し手を適用（GameState更新なし、純粋な盤面操作） */
export function applyActionToBoard(state: BoardState, action: Action, player: Player): BoardState {
  let newState = cloneBoard(state);

  if (action.type === 'move') {
    const piece = getPieceAt(state, action.from);
    if (!piece) return newState;

    // 移動先に相手の駒があれば取る
    const captured = getPieceAt(state, action.to);
    if (captured) {
      const capturedBase = demote(captured.type);
      newState = addMochigoma(newState, player, capturedBase);
    }

    // 元の位置を空にする
    newState = setPieceAt(newState, action.from, null);

    // 新しい位置に駒を置く（成りの処理）
    let newType: PieceType = piece.type;
    if (action.promote) {
      const promoted = PROMOTION_MAP[piece.type as KomaType];
      if (promoted) newType = promoted;
    }
    newState = setPieceAt(newState, action.to, { type: newType, owner: player });
  } else {
    // 打ち
    newState = setPieceAt(newState, action.to, { type: action.piece, owner: player });
    newState = removeMochigoma(newState, player, action.piece);
  }

  return newState;
}

/**
 * 二歩判定
 * 同じ筋に未成の歩が既にある場合はtrue
 */
export function isNifu(state: BoardState, suji: number, player: Player): boolean {
  for (let dan = 1; dan <= 9; dan++) {
    const piece = getPieceAt(state, { suji, dan });
    if (piece && piece.owner === player && piece.type === 'fu') {
      return true;
    }
  }
  return false;
}

/**
 * 打ち歩詰め判定
 * 歩を打って相手の王が詰みになる場合はtrue
 * ※突き歩詰め（盤上の歩を進めて詰み）は合法
 */
export function isUchifuzume(state: BoardState, dropPos: Position, player: Player): boolean {
  const opp = opponent(player);

  // 歩を打った後の盤面を生成
  let newState = cloneBoard(state);
  newState = setPieceAt(newState, dropPos, { type: 'fu', owner: player });
  newState = removeMochigoma(newState, player, 'fu');

  // 相手の王が王手されているか
  if (!isInCheck(newState, opp)) return false;

  // 相手に合法手があるか → なければ打ち歩詰め
  const oppMoves = generatePseudoMoves(newState, opp);
  const oppDrops = generatePseudoDrops(newState, opp);

  for (const move of oppMoves) {
    if (!wouldBeInCheck(newState, move, opp)) return false; // 逃げ手がある
  }
  for (const drop of oppDrops) {
    if (!wouldBeInCheck(newState, drop, opp)) return false; // 合駒がある
  }

  return true; // 相手に合法手がない = 打ち歩詰め
}

/**
 * 行き所のない駒の判定
 * その位置に駒を置いた場合、一度も動けないならtrue
 */
export function hasNoLegalSquare(pieceType: KomaType, pos: Position, player: Player): boolean {
  if (player === 'sente') {
    // 先手にとって「前」は段が小さい方向
    if (pieceType === 'fu' || pieceType === 'kyou') {
      return pos.dan === 1; // 1段目に打てない
    }
    if (pieceType === 'kei') {
      return pos.dan <= 2; // 1〜2段目に打てない
    }
  } else {
    // 後手にとって「前」は段が大きい方向
    if (pieceType === 'fu' || pieceType === 'kyou') {
      return pos.dan === 9; // 9段目に打てない
    }
    if (pieceType === 'kei') {
      return pos.dan >= 8; // 8〜9段目に打てない
    }
  }
  return false;
}

/**
 * 成り判定
 * @returns 'must' | 'can' | 'cannot'
 */
export function promotionStatus(piece: Piece, from: Position, to: Position): 'must' | 'can' | 'cannot' {
  // 既に成っている駒は成れない
  if (isPromoted(piece.type)) return 'cannot';

  // 金将・王将/玉将は成れない
  if (piece.type === 'kin' || piece.type === 'ou' || piece.type === 'gyoku') return 'cannot';

  // 成れる駒かチェック
  if (!(piece.type in PROMOTION_MAP)) return 'cannot';

  const isInEnemyTerritory = (dan: number, player: Player): boolean => {
    return player === 'sente' ? dan <= 3 : dan >= 7;
  };

  const fromInEnemy = isInEnemyTerritory(from.dan, piece.owner);
  const toInEnemy = isInEnemyTerritory(to.dan, piece.owner);

  if (!fromInEnemy && !toInEnemy) return 'cannot';

  // 行き所がなくなる場合は強制成り
  if (hasNoLegalSquare(piece.type as KomaType, to, piece.owner)) return 'must';

  return 'can';
}

/** 詰み判定（現在の手番のプレイヤーが詰んでいるか） */
export function isCheckmate(game: GameState): boolean {
  const { boardState, teban } = game;

  // まず王手されているか
  if (!isInCheck(boardState, teban)) return false;

  // 合法手が1つでもあれば詰みではない
  const legalMoves = generateLegalMoves(game);
  return legalMoves.length === 0;
}

/**
 * 千日手判定
 * 同一局面が4回出現したら千日手
 */
export function isSennichite(game: GameState): boolean {
  const lastHash = game.positionHistory[game.positionHistory.length - 1];
  if (!lastHash) return false;

  let count = 0;
  for (const hash of game.positionHistory) {
    if (hash === lastHash) count++;
  }
  return count >= 4;
}

/**
 * 持将棋判定（簡易版・MVP）
 * 双方の王が入玉している場合に点数計算
 * 大駒（飛車・角）5点、小駒1点、双方24点以上なら引き分け
 */
export function isJishogi(game: GameState): boolean {
  const { boardState } = game;
  const senteOu = findOu(boardState, 'sente');
  const goteOu = findOu(boardState, 'gote');

  if (!senteOu || !goteOu) return false;

  // 先手の王が4段目以上、後手の王が6段目以下に入玉
  if (senteOu.dan > 3 || goteOu.dan < 7) return false;

  // 点数計算
  const sentePoints = calculateJishogiPoints(boardState, 'sente');
  const gotePoints = calculateJishogiPoints(boardState, 'gote');

  return sentePoints >= 24 && gotePoints >= 24;
}

function calculateJishogiPoints(state: BoardState, player: Player): number {
  let points = 0;

  // 盤上の駒
  for (let dan = 1; dan <= 9; dan++) {
    for (let suji = 1; suji <= 9; suji++) {
      const piece = getPieceAt(state, { suji, dan });
      if (!piece || piece.owner !== player) continue;
      if (piece.type === 'ou' || piece.type === 'gyoku') continue;

      const base = demote(piece.type);
      points += (base === 'hisha' || base === 'kaku') ? 5 : 1;
    }
  }

  // 持ち駒
  const mochi = player === 'sente' ? state.senteMochigoma : state.goteMochigoma;
  for (const [pieceType, count] of Object.entries(mochi)) {
    if (!count) continue;
    const base = pieceType as KomaType;
    points += ((base === 'hisha' || base === 'kaku') ? 5 : 1) * count;
  }

  return points;
}
