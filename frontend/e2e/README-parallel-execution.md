# Parallel Execution Optimization Guide

This guide helps you find the optimal balance between test execution speed and resource consumption for your CI/CD pipeline.

## 📋 Overview

We provide three different Playwright configurations to test different parallel execution strategies:

1. **Conservative** - Prioritizes reliability and resource conservation
2. **Balanced** - Good balance between speed and resource usage
3. **Aggressive** - Maximum speed and parallelism

## 🚀 Quick Start

### 1. Run Performance Tests

Execute the performance testing script to compare all configurations:

```bash
# Make sure backend is running first
npm run dev

# In another terminal, run the performance tests
./scripts/test-parallel-performance.sh
```

This will:

- Run tests with each configuration
- Measure execution time and resource usage
- Generate comparison report with recommendations
- Create detailed HTML reports for analysis

### 2. Review Results

The script generates several outputs:

- **Console Report**: Immediate feedback with recommendations
- **HTML Reports**: Detailed test results in `e2e/test-results/`
- **Performance Log**: Complete execution log in `e2e/test-results/performance-test.log`
- **Timing Data**: Raw timing data in `e2e/test-results/timing-results.txt`

## ⚙️ Configuration Details

### Conservative Configuration

**Best for**: Resource-constrained environments, initial testing

```typescript
workers: 2; // Limited parallel workers
fullyParallel: false; // Sequential test file execution
retries: 2; // More retries for stability
projects: ["Chrome only"]; // Single browser
```

**Characteristics**:

- Lowest resource usage
- Highest reliability
- Slowest execution
- Good for debugging

### Balanced Configuration

**Best for**: Standard development and CI/CD environments

```typescript
workers: process.env.CI ? 4 : 2; // Environment-aware
fullyParallel: true; // Parallel test files
retries: process.env.CI ? 2 : 1; // Adaptive retries
projects: ["Chrome", "iPhone"]; // Key browsers
```

**Characteristics**:

- Good speed/resource balance
- Moderate reliability
- Covers main browsers
- Recommended starting point

### Aggressive Configuration

**Best for**: High-resource environments, time-critical testing

```typescript
workers: process.env.CI ? 8 : 4; // Maximum workers
fullyParallel: true; // Full parallelism
retries: 1; // Minimal retries
projects: [
  /* All browsers */
]; // Complete matrix
```

**Characteristics**:

- Fastest execution
- Highest resource usage
- May have flaky tests
- Complete browser coverage

## 📊 Measurement Metrics

The performance testing measures:

### Speed Metrics

- **Total Duration**: Wall-clock time for complete test run
- **Tests per Minute**: Throughput measurement
- **Speedup Factor**: Relative speed compared to conservative config

### Resource Metrics

- **Worker Count**: Number of parallel processes
- **Project Count**: Number of browser/device combinations
- **CPU Usage**: Estimated based on worker count and system specs

### Reliability Metrics

- **Success Rate**: Percentage of tests passing
- **Retry Count**: Number of test retries needed
- **Flakiness Score**: Reliability with retry penalty

## 🎯 Optimization Strategies

### For Local Development

```bash
# Use conservative config for stability
npx playwright test --config=e2e/configs/playwright.conservative.config.ts

# Or balanced for moderate speed
npx playwright test --config=e2e/configs/playwright.balanced.config.ts
```

### For CI/CD Pipelines

1. **Start with Balanced**: Good baseline for most CI environments
2. **Monitor Resources**: Watch CPU/memory usage in CI logs
3. **Adjust Workers**: Scale based on CI runner specifications
4. **Test Reliability**: Monitor flaky test rates

### For Different Test Types

```bash
# Quick smoke tests - use aggressive
npx playwright test --config=e2e/configs/playwright.aggressive.config.ts --grep="@smoke"

# Critical path tests - use conservative
npx playwright test --config=e2e/configs/playwright.conservative.config.ts --grep="@critical"

# Full regression - use balanced
npx playwright test --config=e2e/configs/playwright.balanced.config.ts
```

## 🔧 Custom Configuration

Create your own optimized configuration:

```typescript
// e2e/configs/playwright.custom.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Adjust based on your environment
  workers: process.env.CI_CORES ? parseInt(process.env.CI_CORES) : 2,

  // Balance projects based on priorities
  projects: [
    { name: "chrome", use: devices["Desktop Chrome"] },
    // Add other browsers based on user analytics
  ],

  // Optimize for your specific needs
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
});
```

## 🎮 Example CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        config: [conservative, balanced, aggressive]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        run: npx playwright test --config=e2e/configs/playwright.${{ matrix.config }}.config.ts

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.config }}
          path: e2e/test-results/
```

### Docker Optimization

```dockerfile
# Optimize for CI/CD container specs
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set resource limits based on container specs
ENV CI_CORES=4
ENV CI_MEMORY=8GB

# Copy and run tests
COPY . /app
WORKDIR /app
RUN npm ci
RUN npx playwright test --config=e2e/configs/playwright.balanced.config.ts
```

## 📈 Performance Monitoringl

### Key Metrics to Track

1. **Execution Time Trends**

   - Monitor test duration over time
   - Watch for performance degradation
   - Set alerting thresholds

2. **Flakiness Rates**

   - Track retry rates by configuration
   - Identify problematic tests
   - Adjust parallelism if needed

3. **Resource Utilization**
   - Monitor CI runner CPU/memory usage
   - Optimize worker counts
   - Balance cost vs. speed

### Alerting Thresholds

```bash
# Set up monitoring alerts
# Execution time > 150% of baseline
# Flakiness rate > 5%
# Resource usage > 80% of available
```

## 🔍 Troubleshooting

### Common Issues

**Tests failing in aggressive mode only**

- Reduce worker count
- Check for resource contention
- Look for state pollution between tests

**CI/CD timeouts**

- Increase overall timeout
- Use more conservative configuration
- Split tests into parallel jobs

**High flakiness rates**

- Add better wait conditions
- Improve test isolation
- Reduce parallelism

**Resource exhaustion**

- Lower worker count
- Reduce concurrent projects
- Use headless mode

### Debug Commands

```bash
# Run with debugging
DEBUG=pw:* npx playwright test --config=e2e/configs/playwright.conservative.config.ts

# Check resource usage during tests
top -p $(pgrep -f playwright)

# Monitor test timing
time npx playwright test --config=e2e/configs/playwright.balanced.config.ts
```

## 📚 Additional Resources

- [Playwright Parallelization Docs](https://playwright.dev/docs/test-parallel)
- [CI/CD Best Practices](https://playwright.dev/docs/ci)
- [Test Isolation Guide](https://playwright.dev/docs/test-isolation)

---

**Next Steps**: Run the performance testing script and use the results to optimize your specific environment and requirements.
