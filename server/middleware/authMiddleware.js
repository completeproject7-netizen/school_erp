const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  let token = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const csrfHeader = req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"];
      const expectedCsrfToken = decoded.csrfToken || req.cookies?.csrf_token;

      if (!csrfHeader || csrfHeader !== expectedCsrfToken) {
        return res.status(403).json({ message: "CSRF token verification failed" });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
