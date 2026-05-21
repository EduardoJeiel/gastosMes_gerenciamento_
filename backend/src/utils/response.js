const successResponse = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data
  });
};

const errorResponse = (res, message, status = 500) => {
  return res.status(status).json({
    success: false,
    error: message
  });
};

module.exports = { successResponse, errorResponse };