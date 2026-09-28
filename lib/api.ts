import { NextResponse } from "next/server"

export type ApiError = { code: string; message: string }
export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: ApiError }

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ ok: true, data }, init)
}

export function fail(status: number, code: string, message: string, headers?: HeadersInit): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json({ ok: false, error: { code, message } }, { status, headers })
}
