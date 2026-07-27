module.exports = {
  testEnvironment: "node",
  testMatch: ["**/src/tests/**/*.test.js"],
  setupFiles: ["./src/tests/jest.setup.js"],
  verbose: true,
  forceExit: true,
  testTimeout: 15000,
};
