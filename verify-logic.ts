async function runVerification() {
  const baseUrl = 'http://localhost:3000/api';

  console.log('Starting verification with corrected logic...');

  // Test 1: Employee hired 2023-01-01 (about 2 years 10 months ago)
  // Expected grants:
  // - 6mo (2023-07-01): 10 days -> Expires 2025-07-01 (EXPIRED)
  // - 18mo (2024-07-01): 11 days -> Expires 2026-07-01 (VALID)
  // - 30mo (2025-07-01): 12 days -> Expires 2027-07-01 (VALID)
  // Total valid: 23 days
  
  console.log('\n=== Test 1: Taro Yamada (Hired 2023-01-01) ===');
  const res1 = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Taro Yamada',
      hireDate: '2023-01-01',
      email: 'taro@example.com'
    })
  });
  const taro = await res1.json();
  console.log('Created:', taro);

  const taroDetail = await fetch(`${baseUrl}/employees/${taro.id}`);
  const taroData = await taroDetail.json();
  
  console.log('\nGrants:');
  taroData.grants.forEach((g: any) => {
    console.log(`  ${new Date(g.grantDate).toLocaleDateString('ja-JP')}: ${g.daysGranted} days (expires ${new Date(g.expirationDate).toLocaleDateString('ja-JP')}) ${g.isExpired ? '[EXPIRED]' : '[VALID]'}`);
  });
  
  console.log(`\nTotal Granted: ${taroData.totalGranted} days`);
  console.log(`Total Used: ${taroData.totalUsed} days`);
  console.log(`Remaining: ${taroData.remaining} days`);
  
  if (taroData.remaining === 23) {
    console.log('✅ SUCCESS: Taro has 23 days remaining (10 expired + 11 + 12 valid)');
  } else {
    console.error(`❌ FAILURE: Expected 23 days, got ${taroData.remaining}`);
  }

  // Test 2: Employee hired 2020-01-01 (about 5 years 10 months ago)
  // Expected grants:
  // - 6mo (2020-07-01): 10 days -> Expires 2022-07-01 (EXPIRED)
  // - 18mo (2021-07-01): 11 days -> Expires 2023-07-01 (EXPIRED)
  // - 30mo (2022-07-01): 12 days -> Expires 2024-07-01 (EXPIRED)
  // - 42mo (2023-07-01): 13 days -> Expires 2025-07-01 (EXPIRED)
  // - 54mo (2024-07-01): 14 days -> Expires 2026-07-01 (VALID)
  // - 66mo (2025-07-01): 15 days -> Expires 2027-07-01 (VALID)
  // Total valid: 29 days
  
  console.log('\n=== Test 2: Hanako Suzuki (Hired 2020-01-01) ===');
  const res2 = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hanako Suzuki',
      hireDate: '2020-01-01',
      email: 'hanako@example.com'
    })
  });
  const hanako = await res2.json();
  
  const hanakoDetail = await fetch(`${baseUrl}/employees/${hanako.id}`);
  const hanakoData = await hanakoDetail.json();
  
  console.log('\nGrants:');
  hanakoData.grants.forEach((g: any) => {
    console.log(`  ${new Date(g.grantDate).toLocaleDateString('ja-JP')}: ${g.daysGranted} days (expires ${new Date(g.expirationDate).toLocaleDateString('ja-JP')}) ${g.isExpired ? '[EXPIRED]' : '[VALID]'}`);
  });
  
  console.log(`\nTotal Granted: ${hanakoData.totalGranted} days`);
  console.log(`Remaining: ${hanakoData.remaining} days`);
  
  if (hanakoData.remaining === 29) {
    console.log('✅ SUCCESS: Hanako has 29 days remaining (14 + 15 valid)');
  } else {
    console.error(`❌ FAILURE: Expected 29 days, got ${hanakoData.remaining}`);
  }

  // Test 3: New employee (hired 2025-01-01, only 10 months ago)
  // Expected: 10 days (6mo grant only)
  console.log('\n=== Test 3: Jiro Tanaka (Hired 2025-01-01) ===');
  const res3 = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jiro Tanaka',
      hireDate: '2025-01-01',
      email: 'jiro@example.com'
    })
  });
  const jiro = await res3.json();
  
  const jiroDetail = await fetch(`${baseUrl}/employees/${jiro.id}`);
  const jiroData = await jiroDetail.json();
  
  console.log('\nGrants:');
  jiroData.grants.forEach((g: any) => {
    console.log(`  ${new Date(g.grantDate).toLocaleDateString('ja-JP')}: ${g.daysGranted} days`);
  });
  
  console.log(`\nRemaining: ${jiroData.remaining} days`);
  
  if (jiroData.remaining === 10) {
    console.log('✅ SUCCESS: Jiro has 10 days (6mo grant only)');
  } else {
    console.error(`❌ FAILURE: Expected 10 days, got ${jiroData.remaining}`);
  }
}

runVerification();
