const http = require('http');

const data = JSON.stringify({
  email: 'test.newfields@hospital.test',
  titlePrefix: 'นาย',
  firstName: 'ทดสอบ',
  lastName: 'ระบบใหม่',
  departmentId: 'DEPT-058',
  role: 'MEMBER',
  jobTitle: 'เจ้าหน้าที่ทดสอบ',
  jobLevel: 'ปฏิบัติการ',
  workLocation: 'อาคาร 2 ชั้น 5',
  internalPhone: '5678'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing Create User API with New Fields...');
console.log('Request data:');
console.log(JSON.parse(data));
console.log('');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('\nResponse:');
      console.log(JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('\n✅ User created successfully!');
        console.log('User ID:', response.data.user.id);
        console.log('Email:', response.data.user.email);
        console.log('Title Prefix:', response.data.user.titlePrefix);
        console.log('First Name:', response.data.user.firstName);
        console.log('Last Name:', response.data.user.lastName);
        console.log('Full Name (generated):', response.data.user.fullName);
        console.log('Work Location:', response.data.user.workLocation);
        console.log('Internal Phone:', response.data.user.internalPhone);
        console.log('Is Verified:', response.data.user.isVerified);
        console.log('Status:', response.data.user.userStatus);
        console.log('\nMessage:', response.data.message);
      } else {
        console.log('\n❌ Error:', response.error);
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e.message);
});

req.write(data);
req.end();
