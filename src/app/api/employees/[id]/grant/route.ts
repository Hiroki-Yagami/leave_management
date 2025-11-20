import { NextResponse } from 'next/server';
import { calculateAndGrantLeave } from '@/lib/leaveService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const grantedCount = await calculateAndGrantLeave(id);
  return NextResponse.json({ grantedCount });
}
