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
  const { userUuid } = req.body;
  try {
    const job = models.Job.build({
      userUuid,
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

module.exports = router;
