export class AppError extends Error {
  constructor(
    public apiCode: number,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
