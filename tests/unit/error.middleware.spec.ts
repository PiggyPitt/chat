import multer from 'multer';
import { errorMiddleware } from '../../src/presentation/server/middlewares/error.middleware.js';
import { AppError } from '../../src/shared/errors/AppError.js';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorMiddleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps an AppError to its status code', () => {
    const res = makeRes();
    errorMiddleware(new AppError('nope', 403), {} as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'nope' });
  });

  it('maps a MulterError to 422', () => {
    const res = makeRes();
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    errorMiddleware(err, {} as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('maps a fileFilter "File type" Error to 422', () => {
    const res = makeRes();
    errorMiddleware(new Error('File type "text/plain" is not allowed'), {} as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('falls back to 500 for anything else', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    errorMiddleware(new Error('unexpected'), {} as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
