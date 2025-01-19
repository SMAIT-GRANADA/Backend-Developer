module.exports = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d'
  },
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }
};