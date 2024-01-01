class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stackk = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;
    this.message = message;

    if (stackk) {
      this.stack = stackk;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
