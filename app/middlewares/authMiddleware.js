// app/middlewares/authMiddleware.js

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No se proporcionó token." });
  }

  try {
    // Eliminar 'Bearer ' del inicio del token si está presente
    const tokenValue = token.startsWith("Bearer ")
      ? token.slice(7, token.length)
      : token;
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    req.user = decoded; // Adjunta la información del usuario decodificada al objeto de solicitud
    next(); // Continúa con la siguiente función de middleware o la ruta
  } catch (err) {
    return res.status(401).json({ message: "Token no autorizado o expirado." });
  }
};
