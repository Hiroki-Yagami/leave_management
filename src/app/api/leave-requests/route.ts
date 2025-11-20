import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  const { employeeId, date, reason } = body;

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId,
      date: new Date(date),
      status: 'APPROVED', // Auto-approve for now
      reason,
    },
  });

  return NextResponse.json(leaveRequest);
}

export async function GET() {
  const requests = await prisma.leaveRequest.findMany({
    include: {
      employee: true
    },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json(requests);
}
