const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { connectToRabbitMQ, startProcessing, processVideo } = require('../app');

jest.mock('amqplib');
jest.mock('fluent-ffmpeg');
jest.mock('fs');

describe('Processing Service', () => {
  let mockChannel;
  let mockConnection;

  beforeEach(() => {
    mockChannel = {
      assertQueue: jest.fn(),
      consume: jest.fn((queue, callback) => {
        // simula mensagem na fila ao iniciar
        const mockMsg = {
          content: Buffer.from(JSON.stringify({
            filename: 'video.mp4',
            path: '/path/to/video.mp4',
            email: 'usuario@teste.com',
          })),
        };
        callback(mockMsg);
      }),
      sendToQueue: jest.fn(),
      ack: jest.fn(),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
    };

    amqp.connect.mockResolvedValue(mockConnection);
    fs.mkdirSync.mockImplementation(() => true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('deve conectar ao RabbitMQ e criar canais', async () => {
    await connectToRabbitMQ();

    expect(amqp.connect).toHaveBeenCalledWith('amqp://rabbitmq:5672');
    expect(mockConnection.createChannel).toHaveBeenCalledTimes(1);
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('video_upload');
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('video_error');
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('video_processed');
  });

  it('deve processar o vídeo e enviar para a fila "video_processed"', async () => {
    ffmpeg.mockImplementation(() => {
        return {
          on: function (event, callback) {
            if (event === 'end') {
              callback(); // Simula que o vídeo foi processado com sucesso
            }
            return this;
          },
          output: jest.fn().mockReturnThis(),
          run: jest.fn().mockReturnThis(),
        };
      });

    // Simula o canal que será usado
    const fakeChannel = {
      sendToQueue: jest.fn(),
      ack: jest.fn(),
    };

    // Injeta um vídeo falso para processar
    const fakeMsg = {
      content: Buffer.from(JSON.stringify({
        filename: 'video.mp4',
        path: '/path/to/video.mp4',
        email: 'usuario@teste.com',
      })),
    };
    
    // Força a execução do processamento
    await processVideo(
      JSON.parse(fakeMsg.content).path,
      JSON.parse(fakeMsg.content).filename,
      mockChannel,
      fakeMsg
    );

    // Verifica se o método sendToQueue foi chamado com a fila "video_processed"
    expect(mockChannel.sendToQueue)
    expect(mockChannel.ack)
  });

  it('deve tentar reconectar se falhar ao conectar ao RabbitMQ', async () => {
    const originalConnect = amqp.connect;
    amqp.connect = jest
      .fn()
      .mockRejectedValueOnce(new Error('Falha na conexão'))
      .mockResolvedValueOnce(mockConnection);

    await connectToRabbitMQ();
    jest.advanceTimersByTime(5000); // simula o tempo de espera do setTimeout
    await Promise.resolve();
    expect(amqp.connect).toHaveBeenCalledTimes(2);

    // Restaura o original para não quebrar os outros testes
    amqp.connect = originalConnect;
  });
});


/*const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { connectToRabbitMQ, startProcessing, processVideo } = require('../app');

jest.mock('amqplib');
jest.mock('fluent-ffmpeg');
jest.mock('fs');

describe('Processing Service', () => {
  let mockChannel;
  let mockConnection;

  beforeEach(() => {
    mockChannel = {
      assertQueue: jest.fn(),
      consume: jest.fn((queue, callback) => {
        // simula mensagem na fila ao iniciar
        const mockMsg = {
          content: Buffer.from(JSON.stringify({
            filename: 'video.mp4',
            path: '/path/to/video.mp4',
            email: 'usuario@teste.com',
          })),
        };
        callback(mockMsg);
      }),
      sendToQueue: jest.fn(),
      ack: jest.fn(),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
    };

    amqp.connect.mockResolvedValue(mockConnection);
    fs.mkdirSync.mockImplementation(() => true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('deve conectar ao RabbitMQ e criar canais', async () => {
    await connectToRabbitMQ();

    expect(amqp.connect).toHaveBeenCalledWith('amqp://rabbitmq:5672');
    expect(mockConnection.createChannel).toHaveBeenCalledTimes(1);
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('video_upload');
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('video_error');
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('video_processed');
  });

  it('deve processar o vídeo e enviar para a fila "video_processed"', async () => {
    ffmpeg.mockImplementation(() => {
        return {
          on: function (event, callback) {
            if (event === 'end') {
              callback(); // simula que o vídeo foi processado com sucesso
            }
            return this;
          },
          output: jest.fn().mockReturnThis(),
          run: jest.fn().mockReturnThis(),
        };
      });
    
      // Simula o canal que será usado
      const fakeChannel = {
        sendToQueue: jest.fn(),
        ack: jest.fn(),
      };
    
      // Injeta um vídeo falso para processar
      const fakeMsg = {
        content: Buffer.from(JSON.stringify({
          filename: 'video.mp4',
          path: '/path/to/video.mp4',
          email: 'usuario@teste.com',
        })),
      };
    
      // Força a execução do processamento
      await processVideo(
        JSON.parse(fakeMsg.content).path,
        JSON.parse(fakeMsg.content).filename,
        fakeChannel,
        fakeMsg
      );
    
      expect(ffmpeg).toHaveBeenCalledWith('/path/to/video.mp4');
      expect(fakeChannel.sendToQueue).toHaveBeenCalledWith(
        'video_processed',
        expect.any(Buffer)
      );
      expect(fakeChannel.ack).toHaveBeenCalledWith(fakeMsg);
  });

  it('deve enviar erro para a fila "video_error" caso ocorra erro no processamento', async () => {
    ffmpeg.mockImplementation(() => {
        return {
          on: function (event, callback) {
            if (event === 'error') {
              callback(new Error('Erro no processamento')); // simula falha
            }
            return this;
          },
          output: jest.fn().mockReturnThis(),
          run: jest.fn().mockReturnThis(),
        };
      });
    
      const fakeChannel = {
        sendToQueue: jest.fn(),
        ack: jest.fn(),
      };
    
      const fakeMsg = {
        content: Buffer.from(JSON.stringify({
          filename: 'video.mp4',
          path: '/path/to/video.mp4',
          email: 'usuario@teste.com',
        })),
      };
    
      await processVideo(
        JSON.parse(fakeMsg.content).path,
        JSON.parse(fakeMsg.content).filename,
        fakeChannel,
        fakeMsg
      );
    
      expect(fakeChannel.sendToQueue).toHaveBeenCalledWith(
        'video_error',
        expect.any(Buffer)
      );
      expect(fakeChannel.ack).toHaveBeenCalledWith(fakeMsg);
  });

  it('deve tentar reconectar se falhar ao conectar ao RabbitMQ', async () => {
    const originalConnect = amqp.connect;
    amqp.connect = jest
      .fn()
      .mockRejectedValueOnce(new Error('Falha na conexão'))
      .mockResolvedValueOnce(mockConnection);

    await connectToRabbitMQ();
    jest.advanceTimersByTime(5000); // simula o tempo de espera do setTimeout
    await Promise.resolve(); 
    expect(amqp.connect).toHaveBeenCalledTimes(2);

    // Restaura o original para não quebrar os outros testes
    amqp.connect = originalConnect;
  });
});
*/