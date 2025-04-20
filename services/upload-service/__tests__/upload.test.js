const request = require('supertest');
const multer = require('multer');

// Mock do multer no topo
jest.mock('multer', () => {
  return () => ({
    single: () => (req, res, next) => {
      req.file = {
        filename: 'test.mp4',
        path: '/fake/path/test.mp4'
      };
      next();
    }
  });
});

// Mocks do RabbitMQ
const mockSendToQueue = jest.fn();
const mockAssertQueue = jest.fn();

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: mockAssertQueue,
      sendToQueue: mockSendToQueue.mockResolvedValue(true),
    }),
  }),
}));

let app, setChannel;

beforeAll(() => {
  const loaded = require('../app');
  app = loaded.app;
  setChannel = loaded.setChannel;

  // Injeta o canal mockado antes dos testes
  setChannel({ sendToQueue: mockSendToQueue });
});

describe('Upload Service', () => {
  it('GET / deve responder com status e mensagem', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Upload Service');
  });

  it('GET /health deve retornar status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /upload deve funcionar com arquivo', async () => {
    const res = await request(app).post('/upload');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Enviado com sucesso');
    expect(mockSendToQueue).toHaveBeenCalledWith(
      'video_upload',
      expect.any(Buffer)
    );
  });
  
  it('POST /upload sem arquivo deve retornar 400', async () => {
    jest.resetModules(); // Limpa o cache
    jest.doMock('multer', () => {
      return () => ({
        single: () => (req, res, next) => {
          req.file = null; // Simula ausência de arquivo
          next();
        }
      });
    });
  
    const { app: appWithoutFile, setChannel: setChannelAgain } = require('../app');
    setChannelAgain({ sendToQueue: mockSendToQueue });
  
    const res = await request(appWithoutFile).post('/upload');
  
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Arquivo não enviado');
  });
});
