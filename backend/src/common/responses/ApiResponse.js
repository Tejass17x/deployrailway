class ApiResponse {
  static success(res, message = 'Success', data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req?.id || ''
      }
    });
  }

  static error(res, message = 'An error occurred', error = {}, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: typeof error === 'string' ? { message: error } : error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req?.id || ''
      }
    });
  }
}

module.exports = ApiResponse;
