export interface ErrorResponse<T> {
    code: number;
    message: string | T;
}

export interface SuccessResponse<T> {
    code: number;
    message: string | T;
}