var express = require('express');
var router = express.Router();
var models = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
var cron = require('node-cron');

router.get('/', async function (req, res) {});

router.get('/node-cron', async (req, res) => {
  const jobs = await models.Job.findAll({
    where: {
      isPublished: true,
      publishedDate: {
        [Op.lt]: moment().subtract(45, 'days').toDate(),
      },
    },
  });

  await jobs.update({
    isPublished: false,
  });

  res.json({
    length,
  });
});

module.exports = router;
