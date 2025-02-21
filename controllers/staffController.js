const staffService = require("../services/staffService");

async function getAllStaff(req, res) {
  try {
    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      position: req.query.position
    };

    const result = await staffService.getAllStaff(queryParams);
    
    if (!result.status) {
      return res.status(500).json({
        status: false,
        message: "Gagal mengambil data staff"
      });
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    console.error("Error in getAllStaff controller:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan internal server"
    });
  }
}

module.exports = {
  getAllStaff
};