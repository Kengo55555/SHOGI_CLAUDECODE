import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  getPieceAt,
  setPieceAt,
  findOu,
  addMochigoma,
  removeMochigoma,
  getMochigoma,
  cloneBoard,
  boardHash,
} from '@/lib/shogi/core';

describe('board', () => {
  describe('createInitialBoard', () => {
    it('初期配置で先手の王将が5九にある', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 5, dan: 9 });
      expect(piece).toEqual({ type: 'ou', owner: 'sente' });
    });

    it('初期配置で後手の玉将が5一にある', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 5, dan: 1 });
      expect(piece).toEqual({ type: 'gyoku', owner: 'gote' });
    });

    it('初期配置で先手の飛車が2八にある', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 2, dan: 8 });
      expect(piece).toEqual({ type: 'hisha', owner: 'sente' });
    });

    it('初期配置で先手の角が8八にある', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 8, dan: 8 });
      expect(piece).toEqual({ type: 'kaku', owner: 'sente' });
    });

    it('初期配置で後手の飛車が8二にある', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 8, dan: 2 });
      expect(piece).toEqual({ type: 'hisha', owner: 'gote' });
    });

    it('初期配置で後手の角が2二にある', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 2, dan: 2 });
      expect(piece).toEqual({ type: 'kaku', owner: 'gote' });
    });

    it('初期配置で7七に先手の歩がある', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 7, dan: 7 });
      expect(piece).toEqual({ type: 'fu', owner: 'sente' });
    });

    it('初期配置で5五は空', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { suji: 5, dan: 5 });
      expect(piece).toBeNull();
    });

    it('初期配置で先手の全歩は7段目にある', () => {
      const board = createInitialBoard();
      for (let suji = 1; suji <= 9; suji++) {
        const piece = getPieceAt(board, { suji, dan: 7 });
        expect(piece).toEqual({ type: 'fu', owner: 'sente' });
      }
    });

    it('初期配置で後手の全歩は3段目にある', () => {
      const board = createInitialBoard();
      for (let suji = 1; suji <= 9; suji++) {
        const piece = getPieceAt(board, { suji, dan: 3 });
        expect(piece).toEqual({ type: 'fu', owner: 'gote' });
      }
    });
  });

  describe('findOu', () => {
    it('先手の王を見つける', () => {
      const board = createInitialBoard();
      expect(findOu(board, 'sente')).toEqual({ suji: 5, dan: 9 });
    });

    it('後手の玉を見つける', () => {
      const board = createInitialBoard();
      expect(findOu(board, 'gote')).toEqual({ suji: 5, dan: 1 });
    });
  });

  describe('持ち駒操作', () => {
    it('持ち駒を追加できる', () => {
      let board = createInitialBoard();
      board = addMochigoma(board, 'sente', 'fu');
      board = addMochigoma(board, 'sente', 'fu');
      board = addMochigoma(board, 'sente', 'kaku');
      expect(getMochigoma(board, 'sente')).toEqual({ fu: 2, kaku: 1 });
    });

    it('持ち駒を削除できる', () => {
      let board = createInitialBoard();
      board = addMochigoma(board, 'sente', 'fu');
      board = addMochigoma(board, 'sente', 'fu');
      board = removeMochigoma(board, 'sente', 'fu');
      expect(getMochigoma(board, 'sente')).toEqual({ fu: 1 });
    });

    it('持ち駒を0にすると削除される', () => {
      let board = createInitialBoard();
      board = addMochigoma(board, 'sente', 'fu');
      board = removeMochigoma(board, 'sente', 'fu');
      expect(getMochigoma(board, 'sente')).toEqual({});
    });
  });

  describe('cloneBoard', () => {
    it('ディープコピーで元の盤面に影響しない', () => {
      const board = createInitialBoard();
      const clone = cloneBoard(board);
      clone.board[0][0] = null;
      expect(getPieceAt(board, { suji: 1, dan: 1 })).not.toBeNull();
    });
  });

  describe('boardHash', () => {
    it('同じ局面は同じハッシュを生成', () => {
      const board1 = createInitialBoard();
      const board2 = createInitialBoard();
      expect(boardHash(board1, 'sente')).toBe(boardHash(board2, 'sente'));
    });

    it('手番が異なると異なるハッシュ', () => {
      const board = createInitialBoard();
      expect(boardHash(board, 'sente')).not.toBe(boardHash(board, 'gote'));
    });
  });
});
