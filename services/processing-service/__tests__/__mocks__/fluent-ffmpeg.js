const mockOn = jest.fn(function (event, callback) {
    if (event === 'start') {
      setImmediate(() => callback('mock-command')); // ou só callback() se preferir
    }
  
    if (event === 'end') {
      setImmediate(callback);
    }
  
    if (event === 'error') {
        setImmediate(new Error('Erro no processamento'))
    }
  
    return mockFfmpegInstance;
  });
  
  const mockFfmpegInstance = {
    on: mockOn,
    output: jest.fn(() => mockFfmpegInstance),
    run: jest.fn(() => mockFfmpegInstance),
  };
  
  const ffmpeg = jest.fn(() => mockFfmpegInstance);
  
  module.exports = ffmpeg;