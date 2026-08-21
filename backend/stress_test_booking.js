async function run() {
  console.log('Starting double-booking prevention stress test...');
  
  const payload = {
    doctorId: 'doc-1',
    patientId: 'pat-1',
    date: '2026-08-26',
    startTime: '10:00',
    endTime: '10:30'
  };

  const requests = Array.from({ length: 5 }).map(async (_, i) => {
    try {
      const res = await fetch('http://localhost:5050/api/appointments/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { success: res.status === 201, status: res.status, data };
    } catch (err) {
      return { success: false, status: 500, data: err.message };
    }
  });

  const results = await Promise.all(requests);
  
  console.log('\n--- Stress Test Results ---');
  results.forEach((res, i) => {
    console.log(`Request #${i + 1}: Success=${res.success} | Status=${res.status} | Details=${JSON.stringify(res.data)}`);
  });

  const successes = results.filter(r => r.success).length;
  const conflicts = results.filter(r => r.status === 409).length;

  console.log('\n--- Summary ---');
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful Locks (Expected 1): ${successes}`);
  console.log(`Conflicts (Expected 4 with 409): ${conflicts}`);

  if (successes === 1 && conflicts === 4) {
    console.log('\n✅ SUCCESS: Double-booking prevention working perfectly!');
  } else {
    console.log('\n❌ FAILURE: Race condition detected!');
  }
}

run();
