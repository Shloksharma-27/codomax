import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function api(endpoint, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runAuthDashboardTests() {
  console.log('=== STARTING AUTH & DASHBOARD FULL VERIFICATION ===\n');

  const ts = Date.now();
  const user1Email = `author1_${ts}@example.com`;
  const user2Email = `author2_${ts}@example.com`;
  const password = 'SecurePassword123!';

  // 1. Validation tests on Registration
  console.log('1. Testing Registration Validation...');
  const shortPassRes = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: `test_${ts}@example.com`, password: '123' }
  });
  assert.strictEqual(shortPassRes.status, 400, 'Password < 8 chars must return 400');
  console.log('   Correctly rejected short password (< 8 chars) with 400 Bad Request');

  const invalidEmailRes = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: 'not-an-email', password }
  });
  assert.strictEqual(invalidEmailRes.status, 400, 'Invalid email format must return 400');
  console.log('   Correctly rejected invalid email format with 400 Bad Request');

  const missingNameRes = await api('/auth/register', {
    method: 'POST',
    body: { name: '', email: `test2_${ts}@example.com`, password }
  });
  assert.strictEqual(missingNameRes.status, 400, 'Missing name must return 400');
  console.log('   Correctly rejected missing name with 400 Bad Request');

  // 2. Register User 1
  console.log('\n2. Registering User 1 (Author 1)...');
  const reg1Res = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Elena Rostova', email: user1Email, password }
  });
  assert.strictEqual(reg1Res.status, 201);
  assert.ok(reg1Res.data.data.token, 'JWT must be issued on registration');
  assert.strictEqual(reg1Res.data.data.user.name, 'Elena Rostova');
  assert.strictEqual(reg1Res.data.data.user.email, user1Email);
  assert.strictEqual(reg1Res.data.data.user.password, undefined, 'Password must never be exposed');
  console.log(`   User 1 registered successfully (Token length: ${reg1Res.data.data.token.length})`);

  // 3. Test Duplicate Email Registration
  console.log('\n3. Testing Duplicate Email Registration...');
  const dupRes = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Duplicate Elena', email: user1Email, password: 'AnotherPassword123!' }
  });
  assert.strictEqual(dupRes.status, 409, 'Duplicate email must return 409 Conflict');
  assert.strictEqual(dupRes.data.success, false);
  assert.ok(dupRes.data.message.includes('already exists'), 'Message must indicate email already in use');
  console.log('   Verified: Duplicate email rejected with 409 Conflict and friendly error');

  // 4. Test Login with Wrong Password
  console.log('\n4. Testing Login with Wrong Password...');
  const badLoginRes = await api('/auth/login', {
    method: 'POST',
    body: { email: user1Email, password: 'WrongPassword999!' }
  });
  assert.strictEqual(badLoginRes.status, 401, 'Bad credentials must return 401');
  assert.strictEqual(badLoginRes.data.message, 'Incorrect email or password.', 'Generic security message required');
  console.log('   Verified: Incorrect password returns 401 with generic message');

  // 5. Test Login with Non-existent Email
  console.log('\n5. Testing Login with Non-existent Email...');
  const noUserLoginRes = await api('/auth/login', {
    method: 'POST',
    body: { email: `nonexistent_${ts}@example.com`, password }
  });
  assert.strictEqual(noUserLoginRes.status, 401, 'Non-existent email must return 401');
  assert.strictEqual(noUserLoginRes.data.message, 'Incorrect email or password.', 'Generic security message required');
  console.log('   Verified: Non-existent email returns 401 with identical generic message');

  // 6. Login as User 1
  console.log('\n6. Logging in as User 1...');
  const login1Res = await api('/auth/login', {
    method: 'POST',
    body: { email: user1Email, password }
  });
  assert.strictEqual(login1Res.status, 200);
  const token1 = login1Res.data.data.token;
  const user1 = login1Res.data.data.user;
  assert.ok(token1, 'JWT must be returned on login');
  assert.strictEqual(user1.email, user1Email);
  console.log(`   Login successful. Logged in as: ${user1.name} (${user1.email})`);

  // 7. Verify GET /api/auth/me
  console.log('\n7. Testing GET /api/auth/me with User 1 token...');
  const meRes = await api('/auth/me', { token: token1 });
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.data.data.user.id, user1.id);
  assert.strictEqual(meRes.data.data.user.email, user1Email);
  console.log(`   GET /api/auth/me verified: ID ${meRes.data.data.user.id}, Name: ${meRes.data.data.user.name}`);

  // 8. Create Posts for User 1 (1 draft, 2 published)
  console.log('\n8. Creating posts for User 1 (1 draft, 2 published)...');
  const post1 = await api('/blogs', {
    method: 'POST',
    token: token1,
    body: {
      title: `Draft Post by Elena ${ts}`,
      content: 'Private thoughts and unfinished drafting...',
      category: 'Productivity',
      status: 'draft'
    }
  });
  assert.strictEqual(post1.status, 201);

  const post2 = await api('/blogs', {
    method: 'POST',
    token: token1,
    body: {
      title: `Architecture in Practice ${ts}`,
      content: 'Published architecture article content.',
      category: 'Technology',
      status: 'published'
    }
  });
  assert.strictEqual(post2.status, 201);

  const post3 = await api('/blogs', {
    method: 'POST',
    token: token1,
    body: {
      title: `Clean Design Systems ${ts}`,
      content: 'Published design systems content.',
      category: 'Design',
      status: 'published'
    }
  });
  assert.strictEqual(post3.status, 201);
  console.log('   Created 3 posts (1 draft, 2 published) for User 1');

  // 9. Verify Dashboard Stats for User 1
  console.log('\n9. Verifying User 1 Dashboard Stats (GET /api/dashboard/stats)...');
  const stats1Res = await api('/dashboard/stats', { token: token1 });
  assert.strictEqual(stats1Res.status, 200);
  const stats1 = stats1Res.data.data;
  assert.strictEqual(stats1.totalPosts, 3);
  assert.strictEqual(stats1.publishedPosts, 2);
  assert.strictEqual(stats1.draftPosts, 1);
  console.log(`   User 1 Stats verified: Total=${stats1.totalPosts}, Published=${stats1.publishedPosts}, Drafts=${stats1.draftPosts}`);

  // 10. Verify User 1 Dashboard Posts (GET /api/blogs?mine=true)
  console.log('\n10. Verifying User 1 Dashboard Posts (GET /api/blogs?mine=true)...');
  const mine1Res = await api('/blogs?mine=true', { token: token1 });
  assert.strictEqual(mine1Res.status, 200);
  assert.strictEqual(mine1Res.data.data.blogs.length, 3);
  const user1Draft = mine1Res.data.data.blogs.find(b => b.status === 'draft');
  assert.ok(user1Draft, 'Draft post should be present in author dashboard');
  console.log(`   User 1 Dashboard returned all 3 posts (including draft: "${user1Draft.title}")`);

  // 11. Register & Login as User 2 (Author 2)
  console.log('\n11. Registering & Logging in as User 2 (Marcus Vance)...');
  const reg2Res = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Marcus Vance', email: user2Email, password }
  });
  assert.strictEqual(reg2Res.status, 201);
  const token2 = reg2Res.data.data.token;

  // 12. Verify User 2 Dashboard Isolation
  console.log('\n12. Verifying User 2 Dashboard Isolation (Must NOT see User 1 posts/drafts)...');
  const stats2Res = await api('/dashboard/stats', { token: token2 });
  assert.strictEqual(stats2Res.status, 200);
  assert.strictEqual(stats2Res.data.data.totalPosts, 0, 'New user must have 0 posts');
  assert.strictEqual(stats2Res.data.data.publishedPosts, 0);
  assert.strictEqual(stats2Res.data.data.draftPosts, 0);

  const mine2Res = await api('/blogs?mine=true', { token: token2 });
  assert.strictEqual(mine2Res.status, 200);
  assert.strictEqual(mine2Res.data.data.blogs.length, 0, 'User 2 must see 0 posts in mine=true');
  console.log('   Verified: User 2 dashboard is completely isolated (0 posts, 0 drafts, 0 stats)');

  // 13. Test Protected Endpoints WITHOUT Token (Must return 401)
  console.log('\n13. Testing Protected Endpoints without Token (Expected: 401)...');
  const noTokenEndpoints = [
    { name: 'GET /api/auth/me', call: () => api('/auth/me') },
    { name: 'GET /api/dashboard/stats', call: () => api('/dashboard/stats') },
    { name: 'GET /api/blogs?mine=true', call: () => api('/blogs?mine=true') },
    { name: 'POST /api/blogs', call: () => api('/blogs', { method: 'POST', body: { title: 'X', content: 'Y' } }) },
    { name: `PUT /api/blogs/${post1.data.data.blog.id}`, call: () => api(`/blogs/${post1.data.data.blog.id}`, { method: 'PUT', body: { title: 'X' } }) },
    { name: `DELETE /api/blogs/${post1.data.data.blog.id}`, call: () => api(`/blogs/${post1.data.data.blog.id}`, { method: 'DELETE' }) }
  ];

  for (const ep of noTokenEndpoints) {
    const res = await ep.call();
    assert.strictEqual(res.status, 401, `${ep.name} without token MUST return 401`);
    assert.strictEqual(res.data.success, false);
    console.log(`   Protected: ${ep.name} -> 401 Unauthorized`);
  }

  // 14. Test Protected Endpoints with Invalid / Tampered Token (Must return 401)
  console.log('\n14. Testing Protected Endpoints with Tampered Token (Expected: 401)...');
  const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload';
  const badTokenRes1 = await api('/auth/me', { token: fakeToken });
  assert.strictEqual(badTokenRes1.status, 401, 'Tampered token must return 401');
  const badTokenRes2 = await api('/dashboard/stats', { token: fakeToken });
  assert.strictEqual(badTokenRes2.status, 401, 'Tampered token must return 401');
  console.log('   Verified: Tampered/invalid tokens rejected with 401 Unauthorized');

  console.log('\n=== ALL AUTHENTICATION & DASHBOARD TESTS PASSED (100%) ===');
}

runAuthDashboardTests().catch((err) => {
  console.error('\nFAILED AUTH/DASHBOARD TEST:', err);
  process.exit(1);
});
