import prisma from './prisma';

// Japanese Labor Standards Act: Paid Leave Grant Table (Corrected)
// 6 months -> 10 days (initial grant)
// 1.5 years (6mo + 1yr) -> 11 days
// 2.5 years (6mo + 2yr) -> 12 days
// 3.5 years (6mo + 3yr) -> 13 days
// ... and so on (+1 day per year)
// Note: Leave of absence periods are not counted toward employment duration

type LeaveOfAbsence = {
  startDate: Date;
  endDate: Date;
};

/**
 * Calculate adjusted months employed, excluding leave of absence periods
 */
function calculateAdjustedMonthsEmployed(
  hireDate: Date,
  today: Date,
  leaveOfAbsences: LeaveOfAbsence[]
): number {
  // Calculate total days between hire date and today
  const totalDays = Math.floor((today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total days of leave of absence
  let leaveOfAbsenceDays = 0;
  for (const loa of leaveOfAbsences) {
    const start = new Date(loa.startDate);
    const end = new Date(loa.endDate);
    
    // Only count leave of absence that has already occurred
    if (start <= today) {
      const effectiveEnd = end > today ? today : end;
      const days = Math.floor((effectiveEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      leaveOfAbsenceDays += Math.max(0, days);
    }
  }
  
  // Adjusted days = total days - leave of absence days
  const adjustedDays = totalDays - leaveOfAbsenceDays;
  
  // Convert to months (approximate: 30.44 days per month)
  const adjustedMonths = Math.floor(adjustedDays / 30.44);
  
  return adjustedMonths;
}

export async function calculateAndGrantLeave(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { 
      leaveGrants: true,
      leaveOfAbsences: true 
    },
  });

  if (!employee) throw new Error('Employee not found');

  const today = new Date();
  const hireDate = new Date(employee.hireDate);
  
  // Calculate adjusted months employed (excluding leave of absence periods)
  const monthsEmployed = calculateAdjustedMonthsEmployed(
    hireDate, 
    today, 
    employee.leaveOfAbsences
  );
  
  const grantsToCreate: Array<{
    employeeId: string;
    grantDate: Date;
    daysGranted: number;
    expirationDate: Date;
  }> = [];

  // First grant: 6 months = 10 days
  if (monthsEmployed >= 6) {
    const firstGrantDate = new Date(hireDate);
    firstGrantDate.setMonth(hireDate.getMonth() + 6);
    
    if (firstGrantDate <= today) {
      const alreadyGranted = employee.leaveGrants.some((g) => {
        const gDate = new Date(g.grantDate);
        return gDate.getFullYear() === firstGrantDate.getFullYear() &&
               gDate.getMonth() === firstGrantDate.getMonth() &&
               gDate.getDate() === firstGrantDate.getDate();
      });

      if (!alreadyGranted) {
        const expirationDate = new Date(firstGrantDate);
        expirationDate.setFullYear(firstGrantDate.getFullYear() + 2);

        grantsToCreate.push({
          employeeId: employee.id,
          grantDate: firstGrantDate,
          daysGranted: 10,
          expirationDate: expirationDate,
        });
      }
    }
  }

  // Subsequent grants: Every year after the first 6 months, +1 day per year
  // Starting from 1.5 years (18 months) = 11 days
  let yearCount = 1;
  while (true) {
    const grantMonths = 6 + (yearCount * 12); // 18, 30, 42, 54...
    if (monthsEmployed < grantMonths) break;

    const grantDate = new Date(hireDate);
    grantDate.setMonth(hireDate.getMonth() + grantMonths);

    if (grantDate > today) break;

    const alreadyGranted = employee.leaveGrants.some((g) => {
      const gDate = new Date(g.grantDate);
      return gDate.getFullYear() === grantDate.getFullYear() &&
             gDate.getMonth() === grantDate.getMonth() &&
             gDate.getDate() === grantDate.getDate();
    });

    if (!alreadyGranted) {
      const expirationDate = new Date(grantDate);
      expirationDate.setFullYear(grantDate.getFullYear() + 2);
      
      const daysGranted = 10 + yearCount; // 11, 12, 13, 14...

      grantsToCreate.push({
        employeeId: employee.id,
        grantDate: grantDate,
        daysGranted: daysGranted,
        expirationDate: expirationDate,
      });
    }

    yearCount++;
  }

  if (grantsToCreate.length > 0) {
    await prisma.leaveGrant.createMany({
      data: grantsToCreate,
    });
  }

  return grantsToCreate.length;
}

/**
 * Reset and recalculate all grants for an employee
 * This should be called when leave of absence periods change
 */
export async function resetAndRecalculateGrants(employeeId: string) {
  // Delete all existing grants
  await prisma.leaveGrant.deleteMany({
    where: { employeeId }
  });

  // Recalculate from scratch
  return await calculateAndGrantLeave(employeeId);
}


export async function getEmployeeLeaveStatus(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      leaveGrants: true,
      leaveRequests: {
        where: { status: 'APPROVED' }
      }
    }
  });

  if (!employee) throw new Error('Employee not found');

  const today = new Date();

  // Calculate total granted days that haven't expired
  const validGrants = employee.leaveGrants.filter((g) => new Date(g.expirationDate) > today);
  const totalGranted = validGrants.reduce((sum: number, g) => sum + g.daysGranted, 0);

  // Calculate total used days
  const totalUsed = employee.leaveRequests.reduce((sum: number, _r) => sum + 1, 0); // Assuming 1 request = 1 day for now

  return {
    totalGranted,
    totalUsed,
    remaining: totalGranted - totalUsed
  };
}

export async function getDetailedLeaveStatus(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      leaveGrants: {
        orderBy: { grantDate: 'asc' }
      },
      leaveRequests: {
        where: { status: 'APPROVED' },
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!employee) throw new Error('Employee not found');

  const today = new Date();

  const grantsWithStatus = employee.leaveGrants.map((grant) => {
    const isExpired = new Date(grant.expirationDate) <= today;
    const daysUntilExpiration = Math.ceil(
      (new Date(grant.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      ...grant,
      isExpired,
      daysUntilExpiration,
      isExpiringSoon: !isExpired && daysUntilExpiration <= 30
    };
  });

  const validGrants = grantsWithStatus.filter((g) => !g.isExpired);
  const totalGranted = validGrants.reduce((sum: number, g) => sum + g.daysGranted, 0);
  const totalUsed = employee.leaveRequests.length;

  return {
    grants: grantsWithStatus,
    totalGranted,
    totalUsed,
    remaining: totalGranted - totalUsed,
    expiringGrants: grantsWithStatus.filter((g) => g.isExpiringSoon)
  };
}

export async function getExpiringLeaves(employeeId: string, withinDays: number = 30) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      leaveGrants: true
    }
  });

  if (!employee) throw new Error('Employee not found');

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + withinDays);

  return employee.leaveGrants.filter((grant) => {
    const expDate = new Date(grant.expirationDate);
    return expDate > today && expDate <= futureDate;
  });
}

