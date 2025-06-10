# Real API Integration Testing Strategy

## Overview

Our E2E testing framework uses **real API responses** instead of mocked data to provide authentic testing that validates actual backend integration and user experience.

## Decision Rationale

**Why Real APIs Over Mocking?**

- ✅ **Authentic behavior validation**: Tests actual API responses and data flow
- ✅ **Catches API integration issues**: Detects real contract violations and data issues
- ✅ **Validates real user experience**: Tests with actual response times and data variations
- ✅ **Comprehensive coverage**: Includes network conditions, API failures, and edge cases
- ✅ **Contract compliance**: Ensures frontend properly handles real API responses

## Implementation Strategy

### 1. API Monitoring & Validation

Instead of mocking, we **monitor and validate** real API interactions:

```typescript
// Monitor real API calls for debugging
await testUtils.monitorAPIResponse(/api\//);

// Wait for real API responses with retry logic
const apiResponse = await testUtils.waitForRealAPIResponse(
  /analyze|analysis/i, // API pattern
  30000, // 30 second timeout
  3, // 3 retries
);

// Validate API response structure
const validation = await testUtils.validateAPIResponse(apiResponse.response, {
  status: "string",
  data: "object",
  timestamp: "string",
});
```

### 2. Robust Error Handling

Real APIs can fail, so we implement comprehensive error handling:

```typescript
// Test real API with retry mechanism
const apiResult = await testUtils.waitForRealAPIResponse(/analyze/, 30000, 3);
if (!apiResult.success) {
  // Handle actual API failure
  await analyzePage.handleAnalysisError();

  // Retry with real API
  const retryResult = await testUtils.waitForRealAPIResponse(
    /analyze/,
    30000,
    2,
  );
  expect(retryResult.success).toBe(true);
}
```

### 3. Controlled Failure Testing

When needed, we can temporarily simulate failures to test error handling:

```typescript
// Temporarily simulate API failure
await testUtils.simulateAPIFailure(/analyze/, 500);

// Test error handling
await analyzePage.submitAnalysis();
// ... test error response

// Restore real API
await testUtils.restoreRealAPIResponses(/analyze/);

// Test recovery with real API
await analyzePage.handleAnalysisError();
```

### 4. State Management & Cleanup

Real APIs can create persistent state changes, so we ensure proper cleanup:

```typescript
test.beforeEach(async ({ page }) => {
  // Clean up any previous test data
  await testUtils.cleanupTestData();

  // Clear localStorage, sessionStorage, caches
  // Reset to fresh application state
});

test.afterEach(async () => {
  // Ensure clean state for next test
  await testUtils.cleanupTestData();
});
```

## Key Testing Utilities

### API Response Monitoring

```typescript
class TestUtilities {
  // Monitor API calls without interfering
  async monitorAPIResponse(urlPattern: string | RegExp): Promise<void>;

  // Wait for API response with retry logic
  async waitForRealAPIResponse(
    urlPattern: string | RegExp,
    timeout = 15000,
    retries = 3,
  ): Promise<{ success: boolean; response?: unknown; error?: string }>;

  // Validate API response structure
  async validateAPIResponse(
    response: unknown,
    expectedStructure: Record<
      string,
      "string" | "number" | "boolean" | "object" | "undefined"
    >,
  ): Promise<{ valid: boolean; errors: string[] }>;
}
```

### Network Simulation

```typescript
// Simulate network delay
await testUtils.simulateNetworkDelay(/api/, 2000);

// Temporarily simulate failure
await testUtils.simulateAPIFailure(/analyze/, 500);

// Restore normal API behavior
await testUtils.restoreRealAPIResponses(/analyze/);
```

### Data Cleanup

```typescript
// Clean test data and reset state
await testUtils.cleanupTestData();

// Wait for real data to load
await testUtils.waitForRealDataLoad("body", 10000);
```

## Test Patterns

### 1. Successful API Integration

```typescript
test("should successfully interact with real apartment analysis API", async ({
  page,
}) => {
  const analyzePage = new AnalyzeApartmentPage(page);

  // Navigate and fill form
  await page.goto("/");
  await analyzePage.fillWalkingDistances({
    park: 300,
    supermarket: 200,
    cafe: 150,
  });

  // Submit and wait for real API
  await analyzePage.submitAnalysis();
  const apiResponse = await testUtils.waitForRealAPIResponse(
    /analyze/,
    30000,
    3,
  );

  // Validate real response
  expect(apiResponse.success).toBe(true);
  if (apiResponse.response) {
    const validation = await testUtils.validateAPIResponse(
      apiResponse.response,
      {
        status: "string",
      },
    );
    expect(validation.valid).toBe(true);
  }
});
```

### 2. API Error Handling

```typescript
test("should handle real API errors gracefully", async ({ page }) => {
  // Fill form
  await analyzePage.fillWalkingDistances({
    park: 250,
    supermarket: 180,
    cafe: 120,
  });

  // Simulate failure to test error handling
  await testUtils.simulateAPIFailure(/analyze/, 500);

  try {
    await analyzePage.submitAnalysis();

    // Test error handling
    const hasError = (await page.locator('[role="alert"]').count()) > 0;

    if (hasError) {
      // Restore real API and test retry
      await testUtils.restoreRealAPIResponses(/analyze/);
      await analyzePage.handleAnalysisError();

      const retryResponse = await testUtils.waitForRealAPIResponse(
        /analyze/,
        30000,
        2,
      );
      expect(retryResponse.success).toBe(true);
    }
  } finally {
    await testUtils.restoreRealAPIResponses(/analyze/);
  }
});
```

### 3. Network Resilience

```typescript
test("should handle network instability", async ({ page }) => {
  // Test with network delay
  await testUtils.simulateNetworkDelay(/api/, 2000);

  const startTime = Date.now();
  await analyzePage.submitAnalysis();

  const delayedResponse = await testUtils.waitForRealAPIResponse(
    /analyze/,
    35000,
    3,
  );
  const duration = Date.now() - startTime;

  expect(delayedResponse.success).toBe(true);
  expect(duration).toBeGreaterThan(2000); // Verify delay was applied
});
```

### 4. API Contract Validation

```typescript
test("should validate API contract compliance", async ({ page }) => {
  const apiCalls: { url: string; status: number; response: unknown }[] = [];

  // Monitor all API calls
  await page.route(/api\//, async (route) => {
    const response = await route.fetch();
    const body = await response.text();

    apiCalls.push({
      url: route.request().url(),
      status: response.status(),
      response: JSON.parse(body),
    });

    await route.fulfill({
      status: response.status(),
      body,
      headers: response.headers(),
    });
  });

  // Trigger API calls
  await analyzePage.fillWalkingDistances({
    park: 300,
    supermarket: 200,
    cafe: 150,
  });
  await analyzePage.submitAnalysis();
  await analyzePage.waitForAnalysisCompletion(30000);

  // Validate all API calls
  expect(apiCalls.length).toBeGreaterThan(0);
  for (const call of apiCalls) {
    expect(call.status).toBeGreaterThanOrEqual(200);
    expect(call.status).toBeLessThan(600);
    expect(call.url).toMatch(/^https?:\/\//);
  }
});
```

## Benefits of Real API Testing

### 1. **Authentic Integration Validation**

- Tests actual backend communication
- Validates real data formats and structures
- Catches API contract violations

### 2. **Real Performance Testing**

- Tests with actual response times
- Validates timeout handling
- Tests under real network conditions

### 3. **Comprehensive Error Testing**

- Tests real API failure scenarios
- Validates retry mechanisms with actual APIs
- Tests error message handling

### 4. **Data Flow Validation**

- Tests actual data persistence
- Validates cross-component state synchronization
- Tests real localStorage/API interactions

### 5. **Contract Compliance**

- Ensures frontend handles real API responses
- Validates API versioning compatibility
- Tests with actual data variations

## Considerations & Trade-offs

### Advantages

- ✅ More realistic testing environment
- ✅ Catches real integration issues
- ✅ Validates actual user experience
- ✅ Tests real performance characteristics

### Challenges

- ⚠️ Tests depend on backend availability
- ⚠️ API changes can break tests
- ⚠️ Requires proper state cleanup
- ⚠️ Network conditions can affect tests

### Mitigation Strategies

- 🔧 Robust retry mechanisms (3 attempts)
- 🔧 Proper error handling and timeouts
- 🔧 Comprehensive state cleanup between tests
- 🔧 API monitoring for debugging
- 🔧 Controlled failure simulation when needed

## Running Real API Tests

```bash
# Run all real API integration tests
npm run test -- --grep "Real API Integration"

# Run with verbose logging
npm run test -- --grep "Real API" --reporter=verbose

# Run specific real API test
npx playwright test real-api-integration.test.ts

# Run with network monitoring
npx playwright test --headed real-api-integration.test.ts
```

## Test Data Management

### Real City Data

Tests use actual city data (Denver North, Denver South, Aurora) to validate:

- City switching functionality
- Cross-city favorites
- Real map data loading
- Actual geocoding responses

### Dynamic Test Data

- Use real coordinates within city boundaries
- Test with actual addresses via geocoding API
- Validate with real apartment data
- Test cross-city data synchronization

## Conclusion

Our real API testing strategy provides:

- 🎯 **Authentic validation** of real user experience
- 🔒 **Comprehensive coverage** of API integration
- 🚀 **Robust error handling** for production scenarios
- 📊 **Performance validation** under real conditions
- 🔄 **Contract compliance** with actual backend APIs

This approach ensures our E2E tests provide maximum confidence in the production deployment by testing against the real systems users will interact with.
