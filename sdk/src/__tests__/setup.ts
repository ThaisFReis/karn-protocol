/**
 * Jest Test Setup
 *
 * Global configuration and mocks for all tests
 */

// Mock window object for browser APIs
global.window = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
} as any;

// Mock document for DOM operations
global.document = {
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
  })),
  head: {
    appendChild: jest.fn(),
  },
} as any;

// Extend jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}
