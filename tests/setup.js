import { vi, beforeEach, afterEach } from 'vitest';

// Mock axios globally for all tests
vi.mock('axios', () => ({
  default: {
    post: vi.fn()
  }
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up environment variables after tests
afterEach(() => {
  delete process.env.IMGBB_API_KEY;
});
