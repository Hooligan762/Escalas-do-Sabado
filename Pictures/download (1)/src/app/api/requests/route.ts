import { NextResponse } from 'next/server';
import { getRequests, writeData } from '@/lib/local-db';
import type { Request as SupportRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const newRequest = await request.json() as SupportRequest;

    if (!newRequest.id) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }
    
    const allRequests = await getRequests();
    allRequests.unshift(newRequest); // Add to the beginning of the array

    await writeData('requests', allRequests);

    return NextResponse.json({ message: 'Request created successfully', request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
