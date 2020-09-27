var express = require('express');
var router = express.Router();
var models = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
var cron = require('node-cron');

router.get('/', async function (req, res) {});

const cronJob = cron.schedule('* * * * 1-7', async () => {
  try {
    await models.Job.update(
      {
        isExpired: true,
        isPublished: false,
      },
      {
        where: {
          isPublished: true,
          publishedDate: {
            [Op.lt]: moment().subtract(45, 'days').toDate(),
          },
        },
      }
    );

    await models.Resume.update(
      {
        isExpired: true,
        isPublished: false,
      },
      {
        where: {
          isPublished: true,
          publishedDate: {
            [Op.lt]: moment().subtract(30, 'days').toDate(),
          },
        },
      }
    );
  } catch (e) {
    throw new Error(e.message);
  }
});
module.exports = { router, cronJob };
