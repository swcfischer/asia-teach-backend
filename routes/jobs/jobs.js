var models = require('../../models');
var router = require('express').Router();
var aws = require('aws-sdk');
const { isAuthorized } = require('../util');
const uuidV4 = require('uuid/v4');

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'us-east-1',
});

var s3 = new aws.S3();

// ! SHOULD USE ISAUTHORIZED

// * Creates a job
// router.post('/job', async (req, res) => {
//   // ! this has to be updated to match the most recent
//   // ! which is the data in the seeders folder
//   const { userUuid, city, ageGroup, name, country, thumbnail } = req.body;
//   try {
//     const job = await models.Job.build({
//       userUuid,
//       city,
//       ageGroup,
//       name,
//       country,
//       thumbnail,
//     });
//     await job.save();

//     return res.json(job);
//   } catch (err) {
//     return res.json({
//       error: true,
//       message: err.message,
//     });
//   }
// });

// // * Creates a job tied to a user
router.post('/jobs/create', async (req, res) => {
  try {
    const job = models.Job.build({
      ...req.body,
      userUuid: 'd174f789-3984-4d2f-ba3d-ddd2196c1696',
    });

    await job.save();

    return res.json({
      job,
    });
  } catch (err) {
    return res.json({
      error: true,
      message: err.message,
    });
  }
});

router.post('/jobs/create/:userUuid', isAuthorized, async (req, res) => {
  try {
    const { userUuid } = req.params;

    const jobs = await models.Job.findAll({
      where: {
        userUuid,
        isPublished: false,
      },
    });

    if (jobs.length > 0) {
      return res.json({
        error: true,
        errorType: 'HAS_JOB',
        message: 'You already have an upublished job',
      });
    }

    const job = models.Job.build({
      userUuid,
    });

    await job.save();

    return res.json({
      error: false,
      message: 'Job created successfully and added to your account page',
    });
  } catch (e) {
    return res.json({
      error: true,
      errorType: 'CATCH',
      message: e.message,
    });
  }
});

router.get('/job/clicks/:jobUuid', async (req, res) => {
  const { jobUuid: uuid } = req.params;
  try {
    const job = await models.Job.findOne({
      where: { uuid },
      attributes: ['numberOfClicks'],
    });

    if (!job) {
      throw new Error('Job does not exist');
    }

    return res.json({
      error: false,
      job,
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.get('/job/metrics/:jobUuid', async (req, res) => {
  const { jobUuid } = req.params;
  try {
    const job = await models.Job.findOne({
      where: {
        uuid: jobUuid,
      },
      attributes: ['timeSpent', 'numberOfClicks', 'favoritedBy'],
    });

    if (!job) {
      throw new Error('This job does not exist');
    }

    return res.json({
      error: false,
      timeSpent: job.timeSpent,
      numberOfClicks: job.numberOfClicks,
      favoritedBy: job.favoritedBy.length,
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

module.exports = router;
