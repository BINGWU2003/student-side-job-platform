// HTTP 状态码
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusValue = (typeof HttpStatus)[keyof typeof HttpStatus];

// 业务响应码（ApiResponse 中 code 字段的约定值）
// 成功统一用 0，错误码与 HTTP 状态码保持一致
export const ApiCode = {
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
} as const;

export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode];
