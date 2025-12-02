// src/proxy.ts
import { NextResponse } from 'next/server'
 
export default function proxy(request: Request) {
  return NextResponse.next()
}