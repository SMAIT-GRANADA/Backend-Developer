function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: false,
      message: 'Silakan login terlebih dahulu'
    });
  }
  next();
}

function checkAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.roles.includes('admin')) {
    return res.status(403).json({
      status: false,
      message: 'Akses ditolak - Anda tidak memiliki hak akses'
    });
  }
  next();
}

module.exports = { checkAuth, checkAdmin };