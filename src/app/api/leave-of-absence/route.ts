import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resetAndRecalculateGrants } from '@/lib/leaveService';

export async function POST(request: Request) {
  const body = await request.json();
  const { employeeId, startDate, endDate, reason } = body;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
  }

  // Check for overlapping leave of absence periods
  const overlapping = await prisma.leaveOfAbsence.findFirst({
    where: {
      employeeId,
      OR: [
        {
          AND: [
            { startDate: { lte: start } },
            { endDate: { gte: start } }
          ]
        },
        {
          AND: [
            { startDate: { lte: end } },
            { endDate: { gte: end } }
          ]
        },
        {
          AND: [
            { startDate: { gte: start } },
            { endDate: { lte: end } }
          ]
        }
      ]
    }
  });

  if (overlapping) {
    return NextResponse.json({ error: 'Leave of absence period overlaps with existing period' }, { status: 400 });
  }

  const leaveOfAbsence = await prisma.leaveOfAbsence.create({
    data: {
      employeeId,
      startDate: start,
      endDate: end,
      reason,
    },
  });

  // Reset and recalculate grants after adding leave of absence
  await resetAndRecalculateGrants(employeeId);

  return NextResponse.json(leaveOfAbsence);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  if (employeeId) {
    const leaveOfAbsences = await prisma.leaveOfAbsence.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json(leaveOfAbsences);
  }

  const allLeaveOfAbsences = await prisma.leaveOfAbsence.findMany({
    include: {
      employee: true
    },
    orderBy: { startDate: 'desc' }
  });

  return NextResponse.json(allLeaveOfAbsences);
}
