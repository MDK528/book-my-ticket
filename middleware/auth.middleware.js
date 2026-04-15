import jwt from "jsonwebtoken"

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).send({ error: "Unauthenticated, token missing" })
  }

  const token = authHeader.split(" ")[1]
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET)
    req.user = decoded
    console.log("Decode", decoded)
    next()
  } catch (err) {
    return res.status(401).send({ error: "Unauthenticated, invalid token" })
  }
}

export default authenticate