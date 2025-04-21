jest.mock('nodemailer');

const nodemailer = require('nodemailer');
const { sendEmail } = require('../app');

describe('sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Variáveis de ambiente simuladas
    process.env.EMAIL_HOST = 'smtp.exemplo.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'notificacao@fiapx.com';
    process.env.EMAIL_PASS = 'senha-fake';
  });

  it('deve enviar um email com os dados corretos', async () => {
    const to = 'usuario@teste.com';
    const filename = 'video123.mp4';
    const errorMessage = 'Erro durante processamento';

    await sendEmail(to, filename, errorMessage);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.exemplo.com',
      port: '587',
      secure: false,
      auth: {
        user: 'notificacao@fiapx.com',
        pass: 'senha-fake'
      }
    });

    expect(nodemailer.mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: `"FIAP X - Notificação de Erro" <notificacao@fiapx.com>`,
        to,
        subject: expect.stringContaining('Erro ao processar'),
        html: expect.stringContaining(filename)
      })
    );
  });

  it('deve lançar erro se envio falhar', async () => {
    nodemailer.mockSendMail.mockRejectedValueOnce(new Error('Falha SMTP'));

    await expect(
      sendEmail('usuario@teste.com', 'video123.mp4', 'Erro')
    ).rejects.toThrow('Falha SMTP');
  });
});

/*
jest.mock('nodemailer', () => {
    const mockSendMail = jest.fn().mockResolvedValue(true);
    const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));
  
    return {
      createTransport: mockCreateTransport,
      __esModule: true,
      mockSendMail,
      mockCreateTransport,
    };
  });
  
  const nodemailer = require('nodemailer');
  const { sendEmail } = require('../app');
  
  describe('sendEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
  
      // Variáveis de ambiente simuladas
      process.env.EMAIL_HOST = 'smtp.exemplo.com';
      process.env.EMAIL_PORT = '587';
      process.env.EMAIL_USER = 'notificacao@fiapx.com';
      process.env.EMAIL_PASS = 'senha-fake';
    });
  
    it('deve enviar um email com os dados corretos', async () => {
      const to = 'usuario@teste.com';
      const filename = 'video123.mp4';
      const errorMessage = 'Erro durante processamento';
  
      await sendEmail(to, filename, errorMessage);
  
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.exemplo.com',
        port: '587',
        secure: false,
        auth: {
          user: 'notificacao@fiapx.com',
          pass: 'senha-fake'
        }
      });
  
      // pega o mock de dentro do pacote mockado
      expect(nodemailer.mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: `"FIAP X - Notificação de Erro" <notificacao@fiapx.com>`,
          to,
          subject: expect.stringContaining('Erro ao processar'),
          html: expect.stringContaining(filename)
        })
      );
    });
  
    it('deve lançar erro se envio falhar', async () => {
      nodemailer.mockSendMail.mockRejectedValueOnce(new Error('Falha SMTP'));
  
      await expect(
        sendEmail('usuario@teste.com', 'video123.mp4', 'Erro')
      ).rejects.toThrow('Falha SMTP');
    });
  });
  */