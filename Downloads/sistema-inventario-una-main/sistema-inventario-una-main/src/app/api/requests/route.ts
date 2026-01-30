import { NextResponse } from 'next/server';
import { getRequests } from '@/lib/db';
import type { Request as SupportRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const newRequest = await request.json() as SupportRequest;

    if (!newRequest.id) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }
    
    // Note: Com PostgreSQL, os requests são inseridos diretamente no banco
    // através de outras partes do sistema. Aqui apenas validamos o request.

    return NextResponse.json({ message: 'Request created successfully', request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
