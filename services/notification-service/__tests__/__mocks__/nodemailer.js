const mockSendMail = jest.fn().mockResolvedValue(true);

module.exports = {
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
  __esModule: true,
  mockSendMail
};
