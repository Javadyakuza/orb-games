type ErrorResponse<T> = {
  code: number;
  message: string | T;
};

type SuccessResponse<T> = {
  code: number;
  message: string | T;
};

export type Response<T> = Promise<SuccessResponse<T> | ErrorResponse<T>>;
