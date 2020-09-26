var express = require('express');
var router = express.Router();
var models = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
var cron = require('node-cron');

router.get('/', async function (req, res) {});

router.get('/node-cron', async (req, res) => {
  try {
    // const jobs = await models.Job.findAll({
    // where: {
    //   isPublished: true,
    //   publishedDate: {
    //     [Op.lt]: moment().subtract(45, 'days').toDate(),
    //   },
    // },
    // });

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

    // if (!jobs) {
    //   return res.json({
    //     error: true,
    //     message: 'No jobs found',
    //   });
    // }

    // await jobs.update({
    //   isPublished: false,
    //   isExpired: true,
    // });

    res.json({
      error: false,
      message: 'Update successful',
    });
  } catch (e) {
    res.json({
      error: true,
      message: e.message,
    });
  }
});

module.exports = router;
