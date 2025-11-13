import jwt from "jsonwebtoken";

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(); // user not logged in

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info
  } catch (err) {
    console.warn("Invalid token, skipping user context");
  }

  next();
};
