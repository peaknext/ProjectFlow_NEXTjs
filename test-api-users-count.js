const http = require('http');

const sessionToken = '17dc4b85a69ebcc1db882f0adccc56bc2a2a4ba20c1f4c37a06cb7db6834fbd7';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users?limit=100',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (json.success) {
        const users = json.data.users;
        console.log('===== ผลจาก API จริง =====\n');
        console.log(`✅ API Success`);
        console.log(`📊 จำนวนผู้ใช้ทั้งหมด: ${users.length} คน\n`);

        // Group by role
        const byRole = {};
        users.forEach(u => {
          if (!byRole[u.role]) byRole[u.role] = [];
          byRole[u.role].push(u);
        });

        console.log('===== แบ่งตาม Role =====\n');
        Object.keys(byRole).sort().reverse().forEach(role => {
          console.log(`📌 ${role}: ${byRole[role].length} คน`);
          byRole[role].forEach((u, i) => {
            console.log(`   ${i + 1}. ${u.fullName}`);
          });
          console.log('');
        });

        // Check admins
        const adminCount = users.filter(u => u.role === 'ADMIN').length;
        if (adminCount > 0) {
          console.log(`✅ ADMIN เห็น ADMIN คนอื่น: ${adminCount} คน`);
        } else {
          console.log(`❌ ADMIN ไม่เห็น ADMIN คนอื่น`);
        }

      } else {
        console.log('❌ API Error:', json);
      }
    } catch (e) {
      console.error('Parse error:', e);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();
