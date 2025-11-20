import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resetAndRecalculateGrants } from '@/lib/leaveService';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const leaveOfAbsence = await prisma.leaveOfAbsence.findUnique({
    where: { id }
  });

  if (!leaveOfAbsence) {
    return NextResponse.json({ error: 'Leave of absence not found' }, { status: 404 });
  }

  await prisma.leaveOfAbsence.delete({
    where: { id }
  });

  // Reset and recalculate grants after removing leave of absence
  await resetAndRecalculateGrants(leaveOfAbsence.employeeId);

  return NextResponse.json({ success: true });
}
