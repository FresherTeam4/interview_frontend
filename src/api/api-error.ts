import { AxiosError } from 'axios'
import type { ApiError, ApiErrorResponse } from '@/types/api'


export function normalizeError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) {
    return {
      status: 0,
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
    }
  }

  if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
    return { status: 0, code: 'TIMEOUT', message: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.' }
  }

  if (!error.response) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Không kết nối được tới máy chủ. Kiểm tra lại đường truyền.',
    }
  }

  const { status, data } = error.response
  const body = (data ?? {}) as ApiErrorResponse

  return {
    status,
    code: body.code ?? `HTTP_${status}`,
    message: body.message ?? defaultMessageFor(status),
    fieldErrors: body.fieldErrors,
  }
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'Dữ liệu gửi lên không hợp lệ.'
    case 401:
      return 'Phiên đăng nhập đã hết hạn.'
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.'
    case 404:
      return 'Không tìm thấy dữ liệu.'
    case 409:
      return 'Dữ liệu đã tồn tại hoặc đang xung đột.'
    case 413:
      return 'File vượt quá dung lượng cho phép.'
    case 415:
      return 'Định dạng file không được hỗ trợ.'
    case 422:
      return 'Dữ liệu không hợp lệ.'
    default:
      return status >= 500 ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.' : 'Đã có lỗi xảy ra.'
  }
}

/** Lấy thông điệp hiển thị được từ bất kỳ lỗi nào (API hoặc lỗi lạ). */
export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (isApiError(error)) return error.message
  return error instanceof Error ? error.message : fallback
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    'message' in error
  )
}
