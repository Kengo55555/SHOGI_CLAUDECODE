import type { ErrorCode } from '@/types/api';

/** エラーコードと日本語メッセージの対応 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: '認証が必要です',
  AUTH_INVALID: '認証トークンが無効です',
  USER_NOT_FOUND: 'ユーザーが見つかりません',
  MATCH_REQUEST_EXISTS: '既に対戦募集を発信しています',
  MATCH_REQUEST_EXPIRED: '対戦募集の有効期限が切れています',
  MATCH_REQUEST_ALREADY_ACCEPTED: 'この募集は既に他のユーザーに応諾されています',
  MATCH_NOT_FOUND: '対局が見つかりません',
  INVALID_MOVE: '不正な指し手です',
  NOT_YOUR_TURN: '相手の手番です',
  GAME_ALREADY_OVER: '対局は既に終了しています',
  RATE_LIMITED: 'リクエスト制限を超過しました。しばらく待ってからお試しください',
  VALIDATION_ERROR: '入力内容に誤りがあります',
  SELF_ACCEPT: '自分の募集に応諾することはできません',
  INTERNAL_ERROR: 'サーバーエラーが発生しました',
};
