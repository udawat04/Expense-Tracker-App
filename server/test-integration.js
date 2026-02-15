#!/usr/bin/env node

/**
 * Integration Test Script
 * Tests all major endpoints to ensure frontend-backend connectivity
 */

const API_URL = 'http://localhost:3001/api';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test123!@#';
let testToken = null;
let testUserId = null;
let testCategoryId = null;
let testTransactionId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function request(method, path, body = null, includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth && testToken) {
    headers.Authorization = `Bearer ${testToken}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (err) {
    console.error(`${colors.red}✗ Request failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

async function test(name, fn) {
  process.stdout.write(`${colors.blue}Testing: ${name}${colors.reset}... `);
  try {
    await fn();
    console.log(`${colors.green}✓${colors.reset}`);
    return true;
  } catch (err) {
    console.log(`${colors.red}✗ ${err.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}=== Expense Manager Backend Integration Tests ===${colors.reset}\n`);
  console.log(`API URL: ${API_URL}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Signup
  if (
    await test('User Signup', async () => {
      const { status, data } = await request('POST', '/auth/signup', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User',
      }, false);

      if (status !== 201) throw new Error(`Expected 201, got ${status}`);
      if (!data.token) throw new Error('No token received');
      if (!data.user?.id) throw new Error('No user ID received');

      testToken = data.token;
      testUserId = data.user.id;
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Login
  if (
    await test('User Login', async () => {
      const { status, data } = await request('POST', '/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }, false);

      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!data.token) throw new Error('No token received');

      testToken = data.token;
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Get Categories
  if (
    await test('Get Categories', async () => {
      const { status, data } = await request('GET', '/categories');

      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!Array.isArray(data)) throw new Error('Expected array response');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Create Category
  if (
    await test('Create Category', async () => {
      const { status, data } = await request('POST', '/categories', {
        name: 'Test Category',
        type: 'expense',
      });

      if (status !== 201) throw new Error(`Expected 201, got ${status}`);
      if (!data.id) throw new Error('No category ID received');

      testCategoryId = data.id;
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Create Transaction
  if (
    await test('Create Transaction', async () => {
      const { status, data } = await request('POST', '/transactions', {
        type: 'expense',
        amount: 500,
        categoryId: testCategoryId,
        categoryName: 'Test Category',
        note: 'Test transaction',
        date: new Date().toISOString(),
        paymentMethod: 'Cash',
      });

      if (status !== 201) throw new Error(`Expected 201, got ${status}: ${JSON.stringify(data)}`);
      if (!data.id) throw new Error('No transaction ID received');

      testTransactionId = data.id;
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: Get Transactions
  if (
    await test('Get Transactions', async () => {
      const { status, data } = await request('GET', '/transactions');

      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!Array.isArray(data)) throw new Error('Expected array response');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: Update Transaction
  if (
    await test('Update Transaction', async () => {
      const { status, data } = await request('PUT', `/transactions/${testTransactionId}`, {
        amount: 750,
        note: 'Updated transaction',
      });

      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (data.amount !== 750) throw new Error('Amount not updated');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: Create Budget
  if (
    await test('Create Budget', async () => {
      const now = new Date();
      const { status, data } = await request('POST', '/budgets', {
        categoryId: testCategoryId,
        categoryName: 'Test Category',
        amount: 5000,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });

      if (status !== 200) throw new Error(`Expected 200, got ${status}: ${JSON.stringify(data)}`);
      if (!data.id) throw new Error('No budget ID received');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 9: Get Budgets
  if (
    await test('Get Budgets', async () => {
      const now = new Date();
      const { status, data } = await request(
        'GET',
        `/budgets?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      );

      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
      if (!Array.isArray(data)) throw new Error('Expected array response');
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 10: Delete Transaction
  if (
    await test('Delete Transaction', async () => {
      const { status } = await request('DELETE', `/transactions/${testTransactionId}`);

      if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✓ All tests passed! Backend integration is working correctly.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Please check the backend.${colors.reset}`);
    process.exit(1);
  }
}

main().catch(console.error);
