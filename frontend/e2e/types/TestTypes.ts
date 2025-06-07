/**
 * Core types and interfaces for E2E testing framework
 */

/**
 * Test data interfaces
 */
export interface TestData {
  cities: CityTestData[];
  coordinates: CoordinateTestData[];
  addresses: AddressTestData[];
  favorites: FavoriteTestData[];
}

export interface CityTestData {
  name: string;
  slug: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface CoordinateTestData {
  lat: number;
  lng: number;
  address?: string;
  description?: string;
}

export interface AddressTestData {
  address: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface FavoriteTestData {
  name: string;
  address: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  features?: Record<string, unknown>;
}

/**
 * Walking distance analysis data
 */
export interface WalkingDistanceData {
  park: number;
  supermarket: number;
  cafe: number;
}

export interface AnalysisResult {
  success: boolean;
  apartmentFeatures?: ApartmentFeature[];
  error?: string;
  duration?: number;
}

export interface ApartmentFeature {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  walkingDistances: WalkingDistanceData;
  score?: number;
}

/**
 * Route planning data
 */
export interface RouteData {
  start: CoordinateTestData;
  end: CoordinateTestData;
  mode?: "walking" | "cycling" | "driving";
}

export interface RouteResult {
  success: boolean;
  route?: {
    coordinates: CoordinateTestData[];
    distance: number;
    duration: number;
  };
  error?: string;
}

/**
 * Layer management data
 */
export interface LayerState {
  result: boolean;
  cluster: boolean;
  park: boolean;
  supermarket: boolean;
  cafe: boolean;
  boundary: boolean;
}

/**
 * Component validation interfaces
 */
export interface ComponentValidation {
  componentName: string;
  isVisible: boolean;
  isEnabled: boolean;
  hasExpectedContent: boolean;
  errors: string[];
}

export interface FormValidation {
  isValid: boolean;
  fieldErrors: Record<string, string>;
  submitEnabled: boolean;
}

/**
 * Test execution interfaces
 */
export interface TestExecutionContext {
  testName: string;
  browser: string;
  device?: string;
  viewport: {
    width: number;
    height: number;
  };
  isMobile: boolean;
  timestamp: string;
}

export interface TestResult {
  context: TestExecutionContext;
  success: boolean;
  duration: number;
  steps: TestStep[];
  errors: string[];
  screenshots: string[];
}

export interface TestStep {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
  screenshot?: string;
}

/**
 * Error handling interfaces
 */
export interface TestError {
  type: "component" | "flow" | "api" | "timeout" | "assertion";
  message: string;
  component?: string;
  selector?: string;
  screenshot?: string;
  stackTrace?: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition: (error: Error) => boolean;
}

/**
 * API response interfaces
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  duration: number;
}

export interface NetworkInterceptionConfig {
  urlPattern: string | RegExp;
  response?: {
    status: number;
    body: unknown;
    headers?: Record<string, string>;
  };
  delay?: number;
  failureRate?: number;
}

/**
 * Device and browser configuration
 */
export interface DeviceConfig {
  name: string;
  viewport: {
    width: number;
    height: number;
  };
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface BrowserConfig {
  name: "chromium" | "firefox" | "webkit" | "edge";
  headless: boolean;
  slowMo?: number;
  devtools?: boolean;
}

/**
 * Touch event interfaces
 */
export interface TouchEventData {
  element: string;
  eventType: "touchstart" | "touchend" | "touchmove";
  coordinates?: {
    x: number;
    y: number;
  };
}

/**
 * Performance monitoring (future expansion)
 */
export interface PerformanceMetrics {
  apiResponseTime: number;
  componentRenderTime: number;
  interactionResponseTime: number;
  totalLoadTime: number;
}
