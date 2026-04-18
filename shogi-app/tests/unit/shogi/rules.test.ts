import { describe, it, expect } from 'vitest';
import {
  createGame,
  applyMove,
  generateLegalMoves,
  isInCheck,
  isNifu,
  hasNoLegalSquare,
  promotionStatus,
  getPieceAt,
  setPieceAt,
  createInitialBoard,
  cloneBoard,
  addMochigoma,
} from '@/lib/shogi/core';
import type { Action, BoardState, GameState, Position } from '@/lib/shogi/core';

describe('rules', () => {
  describe('初期配置の合法手', () => {
    it('先手の初期合法手は30手（歩9+角0+飛0+桂0+香0+銀0+金0+王0 ... 実際は歩9筋+角0+桂2飛び=... ）', () => {
      const game = createGame();
      const moves = generateLegalMoves(game);
      // 先手初手: 歩9通り + 角1通り(7七角) + 飛1通り(なし...飛は歩の後ろ) + 桂跳ね不可 + 香前方歩で塞がれ + 銀・金・王は歩の後ろ
      // 実際: 各歩が1マス前進×9 = 9手、右桂(1七→不可)、左桂(9七→不可)
      // 7六歩(7七の歩が前進)が通ると角が動ける
      // 初期配置では歩しか動かせない = 9手... ただし桂馬は歩を飛び越えない
      // 実は初期配置で動かせるのは歩9枚(各1マス前進) = 9手... ではない
      // 飛車は歩で塞がれている、角も塞がれている。金銀も歩の後ろ。
      // 桂馬も歩を飛び越えられない... 桂馬はjump=trueだが2段前+1横なので1七桂は歩を飛び越えて...
      // 桂馬は9九の桂: (9,9)→(8,7)歩がある or (10,7)盤外。1九の桂: (1,9)→(0,7)盤外 or (2,7)歩がある
      // → 桂馬も不可。結局歩9手のみ... ではなく
      // 実は7七の歩の前(7六)は空きなので7六歩はOK、同様に全歩9マスは1マス前進可能
      // → 合法手 = 30手（正確な数）
      // 先手初期合法手: 歩9通り(各筋前進) + 右香(不可:歩の後ろ) + 左香(不可:歩の後ろ)
      // → 実は30手: よく知られた将棋の初手合法手数は30手
      expect(moves.length).toBe(30);
    });
  });

  describe('駒の移動', () => {
    it('先手の歩が1マス前進できる', () => {
      const game = createGame();
      const result = applyMove(game, {
        type: 'move',
        from: { suji: 7, dan: 7 },
        to: { suji: 7, dan: 6 },
        promote: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(getPieceAt(result.game.boardState, { suji: 7, dan: 6 })).toEqual({
          type: 'fu',
          owner: 'sente',
        });
        expect(getPieceAt(result.game.boardState, { suji: 7, dan: 7 })).toBeNull();
        expect(result.game.teban).toBe('gote');
        expect(result.game.moveCount).toBe(1);
      }
    });

    it('歩が後退できない', () => {
      const game = createGame();
      const result = applyMove(game, {
        type: 'move',
        from: { suji: 7, dan: 7 },
        to: { suji: 7, dan: 8 },
        promote: false,
      });
      expect(result.success).toBe(false);
    });

    it('味方の駒がいる場所には移動できない', () => {
      const game = createGame();
      // 7七の歩を7八（金のいる場所ではなく8八角の場所...いや7八は空き）
      // 9九の香が9八に... 9八は空きではない（9八は？初期配置で9八は空き）
      // いや、先手の歩(7七)を6八(金がいる)に動かそうとするが歩は前にしか進めない
      // 金(6九)を6八に... でも6八は空き。
      // テスト: 王(5九)を5八に... 5八は空きだが歩が前にいるので王は...
      // → 簡単に: 9九の香を9八に移動。9八は空き。これは合法。
      // 味方の駒のいる場所テスト: 9九香を9七歩(味方)の場所に。香は走り駒なので9八(空き)は通過して9七に行こうとするが味方の歩で止まる
      // でもこれは「9七に移動しようとしたら味方がいるので不可」
      // 初期配置で直接テストしにくいので、カスタム盤面を作る
      const board = createInitialBoard();
      // 5八に金を置く（テスト用）... 5八は空きなのでそのまま
      // → 5九の王を5八に動かすのは合法（5八は空き）
      // テストを変更: 5九の王を4九(金がいる)に動かそうとする
      const result = applyMove(game, {
        type: 'move',
        from: { suji: 5, dan: 9 },
        to: { suji: 4, dan: 9 },
        promote: false,
      });
      expect(result.success).toBe(false); // 4九に金将がいる
    });
  });

  describe('駒を取る', () => {
    it('相手の駒を取ると持ち駒になる', () => {
      // カスタム局面: 先手の飛車が5五にいて、後手の歩が5四にいる
      const game = createGame();
      // 何手か指して局面を作る代わりに、直接テスト
      // 7六歩 → 3四歩 → 2二角成 のような手順で角を取るテスト
      let g = game;
      // 先手: 7六歩
      let r = applyMove(g, { type: 'move', from: { suji: 7, dan: 7 }, to: { suji: 7, dan: 6 }, promote: false });
      expect(r.success).toBe(true);
      if (!r.success) return;
      g = r.game;

      // 後手: 3四歩
      r = applyMove(g, { type: 'move', from: { suji: 3, dan: 3 }, to: { suji: 3, dan: 4 }, promote: false });
      expect(r.success).toBe(true);
      if (!r.success) return;
      g = r.game;

      // 先手: 8八角→2二角成（角交換）
      r = applyMove(g, { type: 'move', from: { suji: 8, dan: 8 }, to: { suji: 2, dan: 2 }, promote: true });
      expect(r.success).toBe(true);
      if (!r.success) return;
      g = r.game;

      // 2二にいた後手の角が先手の持ち駒に（成駒は元に戻る）
      expect(g.boardState.senteMochigoma).toEqual({ kaku: 1 });
      // 2二に先手の馬がいる
      expect(getPieceAt(g.boardState, { suji: 2, dan: 2 })).toEqual({ type: 'uma', owner: 'sente' });
    });
  });

  describe('二歩判定', () => {
    it('同じ筋に歩がある場合はtrue', () => {
      const board = createInitialBoard();
      // 7筋に先手の歩が7七にある
      expect(isNifu(board, 7, 'sente')).toBe(true);
    });

    it('歩がない筋ではfalse', () => {
      // 歩が取られた後の状態をシミュレート
      let board = createInitialBoard();
      board = setPieceAt(board, { suji: 7, dan: 7 }, null); // 7七の歩を除去
      expect(isNifu(board, 7, 'sente')).toBe(false);
    });
  });

  describe('行き所のない駒の判定', () => {
    it('先手の歩は1段目に打てない', () => {
      expect(hasNoLegalSquare('fu', { suji: 5, dan: 1 }, 'sente')).toBe(true);
    });

    it('先手の歩は2段目には打てる', () => {
      expect(hasNoLegalSquare('fu', { suji: 5, dan: 2 }, 'sente')).toBe(false);
    });

    it('先手の桂は1段目に打てない', () => {
      expect(hasNoLegalSquare('kei', { suji: 5, dan: 1 }, 'sente')).toBe(true);
    });

    it('先手の桂は2段目に打てない', () => {
      expect(hasNoLegalSquare('kei', { suji: 5, dan: 2 }, 'sente')).toBe(true);
    });

    it('先手の桂は3段目には打てる', () => {
      expect(hasNoLegalSquare('kei', { suji: 5, dan: 3 }, 'sente')).toBe(false);
    });

    it('後手の歩は9段目に打てない', () => {
      expect(hasNoLegalSquare('fu', { suji: 5, dan: 9 }, 'gote')).toBe(true);
    });

    it('後手の桂は8〜9段目に打てない', () => {
      expect(hasNoLegalSquare('kei', { suji: 5, dan: 8 }, 'gote')).toBe(true);
      expect(hasNoLegalSquare('kei', { suji: 5, dan: 9 }, 'gote')).toBe(true);
    });
  });

  describe('成り判定', () => {
    it('先手の歩が1段目に行くときは強制成り', () => {
      const result = promotionStatus(
        { type: 'fu', owner: 'sente' },
        { suji: 5, dan: 2 },
        { suji: 5, dan: 1 }
      );
      expect(result).toBe('must');
    });

    it('先手の歩が3段目に入るときは成れる', () => {
      const result = promotionStatus(
        { type: 'fu', owner: 'sente' },
        { suji: 5, dan: 4 },
        { suji: 5, dan: 3 }
      );
      expect(result).toBe('can');
    });

    it('先手の歩が5段目で動くときは成れない', () => {
      const result = promotionStatus(
        { type: 'fu', owner: 'sente' },
        { suji: 5, dan: 6 },
        { suji: 5, dan: 5 }
      );
      expect(result).toBe('cannot');
    });

    it('金将は成れない', () => {
      const result = promotionStatus(
        { type: 'kin', owner: 'sente' },
        { suji: 5, dan: 4 },
        { suji: 5, dan: 3 }
      );
      expect(result).toBe('cannot');
    });

    it('既に成っている駒は成れない', () => {
      const result = promotionStatus(
        { type: 'ryuu', owner: 'sente' },
        { suji: 5, dan: 4 },
        { suji: 5, dan: 3 }
      );
      expect(result).toBe('cannot');
    });
  });

  describe('ゲーム進行', () => {
    it('手番が正しく交代する', () => {
      const game = createGame();
      expect(game.teban).toBe('sente');

      const r = applyMove(game, {
        type: 'move',
        from: { suji: 7, dan: 7 },
        to: { suji: 7, dan: 6 },
        promote: false,
      });

      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.game.teban).toBe('gote');
      }
    });

    it('終了したゲームには指し手を適用できない', () => {
      let game = createGame();
      game = { ...game, status: { type: 'resign', winner: 'gote' } };

      const r = applyMove(game, {
        type: 'move',
        from: { suji: 7, dan: 7 },
        to: { suji: 7, dan: 6 },
        promote: false,
      });
      expect(r.success).toBe(false);
    });
  });
});
