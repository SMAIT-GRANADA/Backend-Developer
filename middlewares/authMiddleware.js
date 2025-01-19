const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await authService.verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        roles: decoded.roles,
      };
    } catch (error) {
      req.user = null;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

async function checkAuth(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        status: false,
        message: "Silakan login terlebih dahulu",
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: false,
        message: "Token akses diperlukan"
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await authService.verifyAccessToken(token);
      if (decoded.id !== req.session.user.id) {
        throw new Error('Token tidak valid');
      }

      req.user = {
        id: decoded.id,
        roles: decoded.roles,
      };
      next();
    } catch (error) {
      if (req.session.user.refreshToken) {
        try {
          const newAccessToken = await authService.refreshAccessToken(req.session.user.refreshToken);
          
          req.session.user.accessToken = newAccessToken;

          res.setHeader('New-Access-Token', newAccessToken);

          const newDecoded = await authService.verifyAccessToken(newAccessToken);
          req.user = {
            id: newDecoded.id,
            roles: newDecoded.roles,
          };
          
          next();
          return;
        } catch (refreshError) {
          req.session.destroy();
          return res.status(401).json({
            status: false,
            message: 'Sesi anda telah berakhir, silakan login kembali'
          });
        }
      }

      return res.status(401).json({
        status: false,
        message: 'Token tidak valid atau kadaluarsa'
      });
    }
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: 'Autentikasi gagal'
    });
  }
}

function checkRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      await checkAuth(req, res, () => {
        const hasAllowedRole = req.user.roles.some((role) =>
          allowedRoles.includes(role)
        );

        if (!hasAllowedRole) {
          return res.status(403).json({
            status: false,
            message: "Akses ditolak - Anda tidak memiliki hak akses",
          });
        }

        next();
      });
    } catch (error) {
      next(error);
    }
  };
}

function academicAccess(action) {
  return async (req, res, next) => {
    try {
      await checkAuth(req, res, () => {
        const userRoles = req.user.roles;

        switch (action) {
          case "create":
          case "update":
            if (!userRoles.includes("guru") && !userRoles.includes("superadmin")) {
              return res.status(403).json({
                status: false,
                message:
                  "Akses ditolak - Hanya Guru dan Superadmin yang dapat mengelola nilai akademik",
              });
            }
            break;

          case "delete":
            if (!userRoles.includes("superadmin")) {
              return res.status(403).json({
                status: false,
                message:
                  "Akses ditolak - Hanya Superadmin yang dapat menghapus nilai akademik",
              });
            }
            break;

          case "read":
            if (
              !userRoles.some((role) =>
                ["guru", "superadmin", "ortu"].includes(role)
              )
            ) {
              return res.status(403).json({
                status: false,
                message:
                  "Akses ditolak - Anda tidak memiliki akses untuk melihat nilai akademik",
              });
            }
            break;

          default:
            return res.status(403).json({
              status: false,
              message: "Aksi tidak diizinkan",
            });
        }

        next();
      });
    } catch (error) {
      next(error);
    }
  };
}

function isSuperAdmin(req, res, next) {
  checkAuth(req, res, () => {
    if (!req.user.roles.includes("superadmin")) {
      return res.status(403).json({
        status: false,
        message: "Akses ditolak - Hanya Superadmin yang dapat mengakses",
      });
    }
    next();
  });
}

function isTeacherOrSuperAdmin(req, res, next) {
  checkAuth(req, res, () => {
    if (
      !req.user.roles.includes("guru") &&
      !req.user.roles.includes("superadmin")
    ) {
      return res.status(403).json({
        status: false,
        message:
          "Akses ditolak - Hanya Guru atau Superadmin yang dapat mengakses",
      });
    }
    next();
  });
}

function isAdmin(req, res, next) {
  checkAuth(req, res, () => {
    if (!req.user.roles.includes("admin")) {
      return res.status(403).json({
        status: false,
        message: "Akses ditolak - Hanya Admin yang dapat mengakses",
      });
    }
    next();
  });
}

function isTeacher(req, res, next) {
  checkAuth(req, res, () => {
    if (!req.user.roles.includes("guru")) {
      return res.status(403).json({
        status: false,
        message: "Akses ditolak - Hanya Guru yang dapat mengakses",
      });
    }
    next();
  });
}

function isParent(req, res, next) {
  checkAuth(req, res, () => {
    if (!req.user.roles.includes("ortu")) {
      return res.status(403).json({
        status: false,
        message: "Akses ditolak - Hanya Orang Tua yang dapat mengakses",
      });
    }
    next();
  });
}

module.exports = {
  optionalAuth,
  checkAuth,
  checkRole,
  academicAccess,
  isSuperAdmin,
  isTeacherOrSuperAdmin,
  isAdmin,
  isTeacher,
  isParent,
};