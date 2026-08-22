import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, { method = 'GET', body, token } = {}) {
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

async function runTests() {
  console.log('=== STARTING CRUD END-TO-END VERIFICATION ===\n');

  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@example.com`;
  const userBEmail = `user_b_${timestamp}@example.com`;
  const password = 'Password123!';

  // 1. Register User A
  console.log('1. Registering User A...');
  const regARes = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Alice Author', email: userAEmail, password }
  });
  assert.strictEqual(regARes.status, 201, `Register User A failed: ${JSON.stringify(regARes.data)}`);
  const tokenA = regARes.data.data.token;
  const userA = regARes.data.data.user;
  console.log(`   User A registered (ID: ${userA.id}, Token: received)`);

  // 2. Register User B
  console.log('2. Registering User B...');
  const regBRes = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Bob Reader', email: userBEmail, password }
  });
  assert.strictEqual(regBRes.status, 201, `Register User B failed: ${JSON.stringify(regBRes.data)}`);
  const tokenB = regBRes.data.data.token;
  const userB = regBRes.data.data.user;
  console.log(`   User B registered (ID: ${userB.id})`);

  // 3. Validation test: Create without title or content
  console.log('3. Testing Server-side Validation on Create...');
  const invalidRes1 = await request('/blogs', {
    method: 'POST',
    token: tokenA,
    body: { title: '', content: '' }
  });
  assert.strictEqual(invalidRes1.status, 400, 'Empty title should return 400');
  console.log('   Correctly rejected empty title with 400 Bad Request');

  const invalidRes2 = await request('/blogs', {
    method: 'POST',
    token: tokenA,
    body: { title: 'Valid Title', content: 'Valid content', category: 'InvalidCategory' }
  });
  assert.strictEqual(invalidRes2.status, 400, 'Invalid category should return 400');
  console.log('   Correctly rejected invalid category with 400 Bad Request');

  // 4. Create Draft Post as User A
  console.log('4. Creating a Draft post as User A...');
  const postTitle = `Mastering Modern Async Patterns ${timestamp}`;
  const createDraftRes = await request('/blogs', {
    method: 'POST',
    token: tokenA,
    body: {
      title: postTitle,
      content: '## Deep Dive into Async/Await\n\nAsync code allows non-blocking execution.\n\n- Promises\n- Event loops\n- Microtasks',
      excerpt: 'A comprehensive guide to asynchronous JavaScript.',
      category: 'Technology',
      tags: ['JavaScript', 'Async', 'NodeJS'],
      status: 'draft'
    }
  });
  assert.strictEqual(createDraftRes.status, 201, `Create Draft failed: ${JSON.stringify(createDraftRes.data)}`);
  assert.strictEqual(createDraftRes.data.data.blog.status, 'draft', 'Status should be draft');
  const postId = createDraftRes.data.data.blog.id;
  console.log(`   Draft created successfully (ID: ${postId}, Status: ${createDraftRes.data.data.blog.status})`);

  // 5. Confirm draft does NOT appear on public list
  console.log('5. Verifying Draft is NOT in public feed...');
  const publicFeedRes1 = await request('/blogs');
  assert.strictEqual(publicFeedRes1.status, 200);
  const foundInPublic = publicFeedRes1.data.data.blogs.some(b => b.id === postId);
  assert.strictEqual(foundInPublic, false, 'Draft post MUST NOT appear in public feed');
  console.log('   Verified: Draft post is hidden from public feed');

  // 6. Confirm draft DOES appear in User A dashboard (mine=true)
  console.log('6. Verifying Draft appears in User A dashboard (mine=true)...');
  const myPostsRes1 = await request('/blogs?mine=true', { token: tokenA });
  assert.strictEqual(myPostsRes1.status, 200);
  const foundInMine = myPostsRes1.data.data.blogs.find(b => b.id === postId);
  assert.ok(foundInMine, 'Draft post MUST appear in user dashboard');
  assert.strictEqual(foundInMine.status, 'draft', 'Status in dashboard should be draft');
  console.log('   Verified: Draft post appears in author dashboard');

  // 7. Publish the post
  console.log('7. Publishing the post (updating status to published)...');
  const publishRes = await request(`/blogs/${postId}`, {
    method: 'PUT',
    token: tokenA,
    body: { status: 'published' }
  });
  assert.strictEqual(publishRes.status, 200, `Publish failed: ${JSON.stringify(publishRes.data)}`);
  assert.strictEqual(publishRes.data.data.blog.status, 'published', 'Status should now be published');
  console.log('   Post published successfully');

  // 8. Confirm published post now appears in public feed
  console.log('8. Verifying published post appears in public feed...');
  const publicFeedRes2 = await request('/blogs');
  assert.strictEqual(publicFeedRes2.status, 200);
  const foundPublished = publicFeedRes2.data.data.blogs.find(b => b.id === postId);
  assert.ok(foundPublished, 'Published post MUST appear in public feed');
  console.log(`   Verified: Post "${foundPublished.title}" is visible in public feed`);

  // 9. Read detail view and track view count
  console.log('9. Fetching single post detail view with ?view=true...');
  const detailRes = await request(`/blogs/${postId}?view=true`);
  assert.strictEqual(detailRes.status, 200);
  assert.strictEqual(detailRes.data.data.blog.title, postTitle);
  assert.ok(detailRes.data.data.blog.views >= 1, 'Views should have incremented');
  console.log(`   Detail view retrieved. Views: ${detailRes.data.data.blog.views}`);

  // 10. Test server-side search
  console.log('10. Testing server-side search by keyword...');
  const searchRes = await request(`/blogs?search=Async+Patterns+${timestamp}`);
  assert.strictEqual(searchRes.status, 200);
  const searchMatch = searchRes.data.data.blogs.find(b => b.id === postId);
  assert.ok(searchMatch, 'Search should return matching post');
  console.log(`   Search returned ${searchRes.data.data.blogs.length} result(s), matching post found`);

  // 11. Test category filtering
  console.log('11. Testing category filtering...');
  const catTechRes = await request('/blogs?category=Technology');
  assert.strictEqual(catTechRes.status, 200);
  const inTech = catTechRes.data.data.blogs.some(b => b.id === postId);
  assert.ok(inTech, 'Post should appear under Technology category');

  const catDesignRes = await request('/blogs?category=Design');
  assert.strictEqual(catDesignRes.status, 200);
  const inDesign = catDesignRes.data.data.blogs.some(b => b.id === postId);
  assert.strictEqual(inDesign, false, 'Technology post should NOT appear under Design category');
  console.log('   Category filter verified (Technology: match, Design: excluded)');

  // 12. Update post (change title, content, excerpt)
  console.log('12. Updating post title and content as author (User A)...');
  const updatedTitle = `Mastering Modern Async Patterns (Updated Edition) ${timestamp}`;
  const updateRes = await request(`/blogs/${postId}`, {
    method: 'PUT',
    token: tokenA,
    body: {
      title: updatedTitle,
      content: '## Updated Deep Dive into Async/Await\n\nUpdated and expanded content.\n\n- Promises\n- Async/Await\n- Web Workers',
      category: 'Technology'
    }
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.data.blog.title, updatedTitle);
  console.log(`   Post title updated to: "${updatedTitle}"`);

  // 13. Security check: User B attempts to edit User A's post
  console.log('13. Security Check: User B attempts to edit User A post (Expected: 403)...');
  const unauthorizedEditRes = await request(`/blogs/${postId}`, {
    method: 'PUT',
    token: tokenB,
    body: { title: 'Hacked by User B' }
  });
  assert.strictEqual(unauthorizedEditRes.status, 403, 'Editing another user post MUST return 403');
  assert.strictEqual(unauthorizedEditRes.data.success, false);
  console.log('   Verified: Server correctly rejected unauthorized edit with 403 Forbidden');

  // 14. Security check: User B attempts to delete User A's post
  console.log('14. Security Check: User B attempts to delete User A post (Expected: 403)...');
  const unauthorizedDeleteRes = await request(`/blogs/${postId}`, {
    method: 'DELETE',
    token: tokenB
  });
  assert.strictEqual(unauthorizedDeleteRes.status, 403, 'Deleting another user post MUST return 403');
  assert.strictEqual(unauthorizedDeleteRes.data.success, false);
  console.log('   Verified: Server correctly rejected unauthorized delete with 403 Forbidden');

  // 15. Delete post as author (User A)
  console.log('15. Deleting post as author (User A)...');
  const deleteRes = await request(`/blogs/${postId}`, {
    method: 'DELETE',
    token: tokenA
  });
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteRes.data.success, true);
  console.log('   Post deleted successfully');

  // 16. Verify post is gone from public feed and dashboard
  console.log('16. Verifying deleted post is removed everywhere...');
  const publicFeedRes3 = await request('/blogs');
  const goneFromPublic = !publicFeedRes3.data.data.blogs.some(b => b.id === postId);
  assert.ok(goneFromPublic, 'Deleted post must not appear in public feed');

  const myPostsRes2 = await request('/blogs?mine=true', { token: tokenA });
  const goneFromMine = !myPostsRes2.data.data.blogs.some(b => b.id === postId);
  assert.ok(goneFromMine, 'Deleted post must not appear in dashboard');
  console.log('   Verified: Post is completely removed from public feed and author dashboard');

  // 17. Verify fetching deleted post returns 404
  console.log('17. Verifying GET on deleted post returns 404...');
  const fetchDeletedRes = await request(`/blogs/${postId}`);
  assert.strictEqual(fetchDeletedRes.status, 404, 'Fetching non-existent post should return 404');
  assert.strictEqual(fetchDeletedRes.data.success, false);
  console.log('   Verified: GET /api/blogs/:id returns 404 Not Found');

  console.log('\n=== ALL CRUD VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('\nFAILED TEST:', err);
  process.exit(1);
});
