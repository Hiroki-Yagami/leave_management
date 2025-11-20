async function runVerification() {
  const baseUrl = 'http://localhost:3000/api';

  console.log('=== Leave of Absence Feature Verification ===\n');

  // Test 1: Create employee
  console.log('1. Creating employee (Hired 2023-01-01)...');
  const res1 = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Employee',
      hireDate: '2023-01-01',
      email: 'test@example.com'
    })
  });
  const employee = await res1.json();
  console.log(`Created: ${employee.name} (ID: ${employee.id})`);

  // Check initial grants
  const detail1 = await fetch(`${baseUrl}/employees/${employee.id}`);
  const data1 = await detail1.json();
  console.log(`\nInitial grants: ${data1.grants.length} grants, ${data1.remaining} days remaining`);
  data1.grants.forEach((g: any) => {
    console.log(`  - ${new Date(g.grantDate).toLocaleDateString('ja-JP')}: ${g.daysGranted} days`);
  });

  // Test 2: Add leave of absence (6 months from 2023-07-01 to 2023-12-31)
  console.log('\n2. Adding leave of absence (2023-07-01 to 2023-12-31, 6 months)...');
  const res2 = await fetch(`${baseUrl}/leave-of-absence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: employee.id,
      startDate: '2023-07-01',
      endDate: '2023-12-31',
      reason: 'Test leave of absence'
    })
  });
  const loa = await res2.json();
  console.log(`Added leave of absence: ${loa.id}`);

  // Check grants after leave of absence
  const detail2 = await fetch(`${baseUrl}/employees/${employee.id}`);
  const data2 = await detail2.json();
  console.log(`\nGrants after adding leave of absence: ${data2.grants.length} grants, ${data2.remaining} days remaining`);
  data2.grants.forEach((g: any) => {
    console.log(`  - ${new Date(g.grantDate).toLocaleDateString('ja-JP')}: ${g.daysGranted} days`);
  });

  console.log('\n✅ Verification complete!');
  console.log('\nExpected behavior:');
  console.log('- Without leave of absence: Grants at 2023-07-01, 2024-07-01, 2025-07-01');
  console.log('- With 6-month leave of absence: First grant should be delayed');
  console.log('  (Adjusted employment duration accounts for the 6-month gap)');
}

runVerification();
