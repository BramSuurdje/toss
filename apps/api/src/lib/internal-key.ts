import { timingSafeEqual } from "node:crypto"
import {
  INTERNAL_API_KEY_HEADER,
  INTERNAL_API_KEY_QUERY_PARAM,
} from "@transferflow/shared"
import type { Context } from "hono"

import { env } from "../env"

function safeEqual(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided)
  const expectedBuf = Buffer.from(expected)
  if (providedBuf.length !== expectedBuf.length) {
    return false
  }
  return timingSafeEqual(providedBuf, expectedBuf)
}

export function readInternalApiKey(c: Context): string | undefined {
  return (
    c.req.header(INTERNAL_API_KEY_HEADER) ??
    c.req.query(INTERNAL_API_KEY_QUERY_PARAM) ??
    undefined
  )
}

export function hasInternalUploadAccess(c: Context): boolean {
  const configured = env.internalApiKey
  if (!configured) {
    return false
  }

  const provided = readInternalApiKey(c)
  if (!provided) {
    return false
  }

  return safeEqual(provided, configured)
}
