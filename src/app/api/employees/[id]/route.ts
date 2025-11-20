import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDetailedLeaveStatus } from '@/lib/leaveService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const detailedStatus = await getDetailedLeaveStatus(id);

  return NextResponse.json({ ...employee, ...detailedStatus });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, hireDate, email } = body;

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name,
      hireDate: hireDate ? new Date(hireDate) : undefined,
      email,
    },
  });

  return NextResponse.json(employee);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Delete related records first (cascade)
  await prisma.leaveRequest.deleteMany({ where: { employeeId: id } });
  await prisma.leaveGrant.deleteMany({ where: { employeeId: id } });
  
  // Then delete employee
  await prisma.employee.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
