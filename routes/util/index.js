const models = require('../../models');
const jwt = require('jsonwebtoken');

async function isAuthorized(req, res, next) {
  const authorization = req.header('authorization');
  const { userUuid } = req.params;

  if (!authorization) {
    return res.json({
      error: true,
      message: 'You are not authorized',
    });
  }

  const token = authorization.split(' ')[1];

  try {
    const verified = await jwt.verify(token, process.env.secret);

    if (verified && verified.data === userUuid) {
      next();
    } else {
      return res.json({
        error: true,
        message: 'You are not authorized',
      });
    }
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
}

module.exports = {
  isAuthorized,
};
