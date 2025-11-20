import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateAndGrantLeave, getEmployeeLeaveStatus } from '@/lib/leaveService';

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const employeesWithStatus = await Promise.all(employees.map(async (emp) => {
    const status = await getEmployeeLeaveStatus(emp.id);
    return { ...emp, ...status };
  }));

  return NextResponse.json(employeesWithStatus);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, hireDate, email } = body;

  const employee = await prisma.employee.create({
    data: {
      name,
      hireDate: new Date(hireDate),
      email,
    },
  });

  // Immediately check for initial grants (e.g. if hire date was in the past)
  await calculateAndGrantLeave(employee.id);

  return NextResponse.json(employee);
}
