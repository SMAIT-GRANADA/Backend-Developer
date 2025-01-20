const staffService = require("../services/staffService");

async function getAllStaff(req, res) {
  try {
    const result = await staffService.getAllStaff(req.query);
    
    if (!result.status) {
      return res.status(500).json({
        status: false,
        message: "Gagal mengambil data staff"
      });
    }

    return res.status(200).json(result);
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