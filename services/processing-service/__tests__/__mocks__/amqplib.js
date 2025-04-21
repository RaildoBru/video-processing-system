const mockAssertQueue = jest.fn().mockResolvedValue(true);
const mockConsume = jest.fn();
const mockSendToQueue = jest.fn();
const mockAck = jest.fn();

const mockChannel = {
  assertQueue: mockAssertQueue,
  consume: mockConsume,
  sendToQueue: mockSendToQueue,
  ack: mockAck,
};

const mockCreateChannel = jest.fn(() => Promise.resolve(mockChannel));

const connect = jest.fn(() =>
  Promise.resolve({
    createChannel: mockCreateChannel,
  })
);

module.exports = {
  connect,
  __mockChannel: mockChannel,
  __mockCreateChannel: mockCreateChannel,
  __mockSendToQueue: mockSendToQueue,
};
