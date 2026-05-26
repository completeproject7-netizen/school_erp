const { ZodError } = require("zod");

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.errors.map((error) => error.message).join(", "),
    });
  }

  const status = err.status || 500;
  return res.status(status).json({
    message: err.message || "Internal server error",
  });
};

module.exports = errorHandler;
