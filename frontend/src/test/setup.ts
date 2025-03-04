import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { createCanvas } from 'canvas';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

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
	constructor(width: number, height: number) {
		return {
			width,
			height,
			data: new Uint8ClampedArray(width * height * 4),
		};
	}
}
global.ImageData = ImageData as unknown as typeof globalThis.ImageData;

// Mock HTMLCanvasElement
const mockCanvas = createCanvas(1000, 1000);
const originalGetContext = HTMLCanvasElement.prototype.getContext;

// Create WebGL mock functions
const createWebGLMock = (canvas: HTMLCanvasElement) => {
	const buffers = new Map();
	let bufferId = 1;

	return {
		canvas,
		getExtension: () => null,
		getParameter: () => { },
		getShaderPrecisionFormat: () => ({
			precision: 23,
			rangeMin: 127,
			rangeMax: 127
		}),
		getContextAttributes: () => ({
			antialias: true,
			preserveDrawingBuffer: false,
			stencil: true
		}),
		createBuffer: () => {
			const id = bufferId++;
			buffers.set(id, { id });
			return { id };
		},
		bindBuffer: () => { },
		bufferData: () => { },
		deleteBuffer: (buffer: { id: number }) => {
			buffers.delete(buffer.id);
		},
		clearColor: () => { },
		clear: () => { },
		viewport: () => { },
		enable: () => { },
		disable: () => { },
		blendFunc: () => { },
		pixelStorei: () => { },
	} as unknown as WebGLRenderingContext;
};

HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextType: string) {
	if (contextType === 'webgl' || contextType === 'webgl2') {
		return createWebGLMock(this);
	}
	return mockCanvas.getContext('2d');
} as typeof originalGetContext;

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