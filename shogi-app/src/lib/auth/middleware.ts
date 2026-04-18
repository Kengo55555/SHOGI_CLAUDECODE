import { NextResponse } from 'next/server';
import { getSessionUser } from './session';
import type { ErrorCode } from '@/types/api';

/** 認証済みユーザーを取得。未認証の場合は401レスポンスを返す */
export async function requireAuth() {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      errorResponse: createErrorResponse('AUTH_REQUIRED', '認証が必要です', 401),
    };
  }

  return { user, errorResponse: null };
}

/** エラーレスポンスを生成 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status }
  );
}

/** 成功レスポンスを生成 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
