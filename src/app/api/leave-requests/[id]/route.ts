import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.leaveRequest.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}
