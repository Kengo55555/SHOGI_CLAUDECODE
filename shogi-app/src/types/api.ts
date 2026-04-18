/** API共通エラーレスポンス */
export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
  };
}

/** エラーコード体系 */
export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'USER_NOT_FOUND'
  | 'MATCH_REQUEST_EXISTS'
  | 'MATCH_REQUEST_EXPIRED'
  | 'MATCH_REQUEST_ALREADY_ACCEPTED'
  | 'MATCH_NOT_FOUND'
  | 'INVALID_MOVE'
  | 'NOT_YOUR_TURN'
  | 'GAME_ALREADY_OVER'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'SELF_ACCEPT'
  | 'INTERNAL_ERROR';

/** API成功レスポンスのラッパー */
export interface ApiSuccess<T> {
  data: T;
}

/** ページネーション付きレスポンス */
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}
