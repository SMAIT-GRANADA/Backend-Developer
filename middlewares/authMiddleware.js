// middlewares/authMiddleware.js

function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: false,
      message: "Silakan login terlebih dahulu",
    });
  }
  req.user = {
    id: req.session.user.id,
    roles: req.session.user.roles,
  };
  next();
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        status: false,
        message: "Silakan login terlebih dahulu",
      });
    }

    const hasAllowedRole = req.session.user.roles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasAllowedRole) {
      return res.status(403).json({
        status: false,
        message: "Akses ditolak - Anda tidak memiliki hak akses",
      });
    }

    next();
  };
}

// Helper function untuk akses akademik
function academicAccess(action) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        status: false,
        message: "Silakan login terlebih dahulu",
      });
    }

    const userRoles = req.session.user.roles;

    switch (action) {
      case "create":
      case "update":
        // Hanya guru dan superadmin yang bisa create dan update
        if (!userRoles.includes("guru") && !userRoles.includes("superadmin")) {
          return res.status(403).json({
            status: false,
            message:
              "Akses ditolak - Hanya Guru dan Superadmin yang dapat mengelola nilai akademik",
          });
        }
        break;

      case "delete":
        // Hanya superadmin yang bisa delete
        if (!userRoles.includes("superadmin")) {
          return res.status(403).json({
            status: false,
            message:
              "Akses ditolak - Hanya Superadmin yang dapat menghapus nilai akademik",
          });
        }
        break;

      case "read":
        // Hanya guru, superadmin, dan ortu yang bisa read
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
  };
}

// Helper functions untuk role spesifik
function isSuperAdmin(req, res, next) {
  if (!req.session.user.roles.includes("superadmin")) {
    return res.status(403).json({
      status: false,
      message: "Akses ditolak - Hanya Superadmin yang dapat mengakses",
    });
  }
  next();
}

function isTeacherOrSuperAdmin(req, res, next) {
  if (
    !req.session.user.roles.includes("guru") &&
    !req.session.user.roles.includes("superadmin")
  ) {
    return res.status(403).json({
      status: false,
      message:
        "Akses ditolak - Hanya Guru atau Superadmin yang dapat mengakses",
    });
  }
  next();
}

function isAdmin(req, res, next) {
  if (!req.session.user.roles.includes("admin")) {
    return res.status(403).json({
      status: false,
      message: "Akses ditolak - Hanya Admin yang dapat mengakses",
    });
  }
  next();
}

function isTeacher(req, res, next) {
  if (!req.session.user.roles.includes("guru")) {
    return res.status(403).json({
      status: false,
      message: "Akses ditolak - Hanya Guru yang dapat mengakses",
    });
  }
  next();
}

function isParent(req, res, next) {
  if (!req.session.user.roles.includes("ortu")) {
    return res.status(403).json({
      status: false,
      message: "Akses ditolak - Hanya Orang Tua yang dapat mengakses",
    });
  }
  next();
}

module.exports = {
  checkAuth,
  checkRole,
  academicAccess,
  isSuperAdmin,
  isTeacherOrSuperAdmin,
  isAdmin,
  isTeacher,
  isParent,
};
