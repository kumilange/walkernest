import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "mock-url");

// Mock Blob
global.Blob = vi.fn();

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserver;

// Mock ImageData
class ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}
global.ImageData = ImageData as unknown as typeof globalThis.ImageData;

// Mock HTMLCanvasElement
const mockCanvasContext = {
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  drawImage: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fill: () => {},
  save: () => {},
  restore: () => {},
  scale: () => {},
  rotate: () => {},
  translate: () => {},
  transform: () => {},
  setTransform: () => {},
  resetTransform: () => {},
  createLinearGradient: () => ({
    addColorStop: () => {},
  }),
  createRadialGradient: () => ({
    addColorStop: () => {},
  }),
  createPattern: () => null,
  clearRect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  clip: () => {},
  isPointInPath: () => false,
  isPointInStroke: () => false,
  fillText: () => {},
  strokeText: () => {},
  measureText: () => ({
    width: 0,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 0,
    fontBoundingBoxAscent: 0,
    fontBoundingBoxDescent: 0,
    fontBoundingBoxLeft: 0,
    fontBoundingBoxRight: 0,
  }),
  getContextAttributes: () => ({
    alpha: true,
    colorSpace: "srgb",
    desynchronized: false,
    willReadFrequently: false,
  }),
  getImageData: () => new ImageData(1, 1),
  putImageData: () => {},
} as unknown as CanvasRenderingContext2D;

const mockWebGLContext = {
  getExtension: () => null,
  getParameter: () => {},
  getShaderPrecisionFormat: () => ({
    precision: 23,
    rangeMin: 127,
    rangeMax: 127,
  }),
  getContextAttributes: () => ({
    antialias: true,
    preserveDrawingBuffer: false,
    stencil: true,
  }),
  createBuffer: () => ({ id: 1 }),
  bindBuffer: () => {},
  bufferData: () => {},
  deleteBuffer: () => {},
  clearColor: () => {},
  clear: () => {},
  viewport: () => {},
  enable: () => {},
  disable: () => {},
  blendFunc: () => {},
  pixelStorei: () => {},
} as unknown as WebGLRenderingContext;

// Mock getContext
HTMLCanvasElement.prototype.getContext = function (contextType: string) {
  if (contextType === "webgl" || contextType === "webgl2") {
    return mockWebGLContext;
  }
  return mockCanvasContext;
} as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock Worker
const mockWorker = {
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  terminate: vi.fn(),
  onmessage: null,
  onmessageerror: null,
  onerror: null,
  onunhandledrejection: null,
  onrejectionhandled: null,
  dispatchEvent: vi.fn(),
};

class Worker {
  constructor() {
    return mockWorker;
  }
  postMessage = mockWorker.postMessage;
  addEventListener = mockWorker.addEventListener;
  removeEventListener = mockWorker.removeEventListener;
  terminate = mockWorker.terminate;
  onmessage = null;
  onmessageerror = null;
  onerror = null;
  onunhandledrejection = null;
  onrejectionhandled = null;
  dispatchEvent = mockWorker.dispatchEvent;
}

global.Worker = Worker as unknown as typeof globalThis.Worker;

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers as any);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
