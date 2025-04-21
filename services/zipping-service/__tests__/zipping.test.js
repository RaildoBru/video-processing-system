const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const amqplib = require('amqplib');

const { start, sendError } = require('../app.js');

jest.mock('fs');
jest.mock('archiver');
jest.mock('amqplib');

describe('Zipping Service', () => {
  const fakeChannel = {
    assertQueue: jest.fn(),
    consume: jest.fn(),
    ack: jest.fn(),
    sendToQueue: jest.fn(),
  };

  const fakeConnection = {
    createChannel: jest.fn().mockResolvedValue(fakeChannel),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do fs.existsSync
    fs.existsSync.mockReturnValue(true);
    
    // Mock do fs.createWriteStream
    fs.createWriteStream.mockReturnValue({
      on: jest.fn((event, cb) => {
        if (event === 'close') cb(); // Simula evento 'close'
      }),
    });

    // Mock do archiver
    archiver.mockReturnValue({
      pipe: jest.fn(),
      directory: jest.fn(),
      finalize: jest.fn().mockResolvedValue(),
      pointer: jest.fn().mockReturnValue(1234),
      on: jest.fn(),
    });

    // Mock do amqplib
    amqplib.connect.mockResolvedValue(fakeConnection);
  });

  it('deve processar mensagem e criar zip com sucesso', async () => {
    const message = {
      content: Buffer.from(JSON.stringify({
        filename: 'video123',
        outputDir: '/videos/output',
        email: 'teste@email.com'
      })),
    };

    fakeChannel.consume.mockImplementationOnce((queue, callback) => {
      callback(message);
    });

    await start();

    expect(archiver).toHaveBeenCalled();
    expect(fakeChannel.ack).toHaveBeenCalledWith(message);
  });

  it('deve enviar erro para fila "video_error" se o diretório for inválido', async () => {
    fs.existsSync.mockReturnValueOnce(false);

    const message = {
      content: Buffer.from(JSON.stringify({
        filename: 'videoErro',
        outputDir: '/caminho/invalido',
        email: 'erro@email.com'
      })),
    };

    fakeChannel.consume.mockImplementationOnce((queue, callback) => {
      callback(message);
    });

    await start();

    expect(fakeChannel.sendToQueue).toHaveBeenCalledWith(
      'video_error',
      expect.any(Buffer)
    );

    const payload = JSON.parse(fakeChannel.sendToQueue.mock.calls[0][1].toString());
    expect(payload.filename).toBe('videoErro');
    expect(payload.email).toBe('erro@email.com');
    expect(payload.error).toContain('Diretório de saída inválido');
  });
});
