var models = require('../../models');
var router = require('express').Router();
var aws = require('aws-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const dataUriToBuffer = require('data-uri-to-buffer');
const { isAuthorized } = require('../util');

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'us-east-1',
});

var s3 = new aws.S3();

router.get('/post-resume/details/:userUuid', isAuthorized, async (req, res) => {
  const { userUuid } = req.params;

  try {
    const resume = await models.Resume.findOne({
      where: {
        userUuid,
      },
      attributes: [
        'education',
        'email',
        'experience',
        'name',
        'nationality',
        'desiredAgeGroup',
        'desiredStartDate',
        'desiredCountry',
      ],
    });

    if (resume) {
      return res.json(resume);
    } else {
      return res.json(null);
    }
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.put('/post-resume/details/:userUuid', isAuthorized, async (req, res) => {
  const { userUuid } = req.params;
  const {
    name,
    email,
    nationality,
    experience,
    education,
    desiredCountry,
    desiredStartDate,
    desiredAgeGroup,
  } = req.body;

  try {
    let resume = await models.Resume.findOne({
      where: {
        userUuid,
      },
      attributes: [
        'uuid',
        'education',
        'email',
        'experience',
        'name',
        'nationality',
        'desiredCountry',
        'desiredStartDate',
        'desiredAgeGroup',
      ],
    });
    if (resume) {
      await resume.update({
        name,
        email,
        nationality,
        experience,
        education,
        desiredCountry,
        desiredStartDate,
        desiredAgeGroup,
      });
      return res.json({
        error: false,
        message: 'Resume details updated successfully',
      });
    } else {
      resume = await models.Resume.create({
        userUuid,
        name,
        email,
        nationality,
        experience,
        education,
        desiredCountry,
        desiredAgeGroup,
        desiredStartDate,
      });
      return res.json({
        error: false,
        message: 'Resume details updated successfully',
      });
    }
  } catch (e) {
    res.json({
      error: true,
      message: e.message,
    });
  }
});

router.get(
  '/post-resume/profile-image/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { userUuid } = req.params;
    try {
      const resume = await models.Resume.findOne({
        where: {
          userUuid,
        },
        attributes: ['uuid', 'profileImage'],
      });

      return res.json(resume);
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
      });
    }
  }
);

router.patch(
  '/post-resume/profile-image/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { userUuid } = req.params;
    const { profileImage } = req.body;
    try {
      const resume = await models.Resume.findOne({
        where: {
          userUuid,
        },
        attributes: ['uuid', 'profileImage'],
      });

      const base64Data = new Buffer(
        profileImage.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );

      const type = profileImage.split(';')[0].split('/')[1];

      const params = {
        Bucket: 'asia-teach-resume-profile',
        Key: `profile-image-${userUuid}`,
        Body: base64Data,
        ACL: 'public-read',
        ContentEncoding: 'base64', // required
        ContentType: `image/${type}`,
      };

      if (resume.profileImage) {
        s3.putObject(params, async (err, data) => {
          return res.json({
            error: false,
            message: 'Profile image updated successfully',
          });
        });
      } else {
        s3.upload(params, async (err, data) => {
          await resume.update({
            profileImage: data.Location,
          });

          return res.json({
            error: false,
            message: 'Profile image uploaded successfully',
          });
        });
      }
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
      });
    }
  }
);

router.get('/post-resume/resume/:userUuid', isAuthorized, async (req, res) => {
  const { userUuid } = req.params;

  try {
    const resume = await models.Resume.findOne({
      where: {
        userUuid,
      },
      attributes: ['resumeUrl', 'resumeHtml'],
    });

    return res.json(resume);
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.patch(
  '/post-resume/resume/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { userUuid } = req.params;
    const { resumeUrl, resumeHtml } = req.body;

    try {
      const resume = await models.Resume.findOne({
        where: {
          userUuid,
        },
      });

      if (resumeHtml) {
        await resume.update({
          resumeHtml,
        });

        return res.json({
          error: false,
          message: 'Resume updated sucessfully',
        });
      }

      const buffer = dataUriToBuffer(resumeUrl);
      const params = {
        Bucket: 'asia-teach-resume-document',
        Key: `resume-document-${userUuid}`,
        Body: buffer,
        ACL: 'public-read',
        ContentEncoding: 'base64', // required
        ContentType: `application/pdf`,
      };

      if (false || resume.resumeUrl) {
        s3.putObject(params, async (err, data) => {
          await resume.update({
            resumeHtml: '',
          });
          return res.json({
            error: false,
            message: 'Resume updated successfully',
          });
        });
      } else {
        s3.upload(params, async (err, data) => {
          console.log('err', err);
          await resume.update({
            resumeUrl: data.Location,
            resumeHtml: '',
          });

          return res.json({
            error: false,
            message: 'Resume uploaded successfully',
          });
        });
      }
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
      });
    }
  }
);

const limit = 12; // 10 search results
// * Reads jobs base on criteria -- has pagination
router.get('/resume-board/filter/:userUuid', isAuthorized, async (req, res) => {
  const {
    nationality,
    experience,
    education,
    page,
    desiredAgeGroup,
    desiredCountry,
    desiredStartDate,
  } = req.query;
  const pageAsNum = page ? Number(page) : 1;

  // if (!nationalities.includes(nationality)) {
  //   return res.json({
  //     error: true,
  //     message: 'That is not a country we have in our search',
  //   });
  // }

  const whereIterator = {
    nationality,
    experience,
    education,
    desiredAgeGroup,
    desiredCountry,
    desiredStartDate,
    isPublished: true,
  }; // isPublished: true
  const whereObj = {};
  for (name in whereIterator) {
    if (whereIterator[name]) {
      whereObj[name] = whereIterator[name];
    }
  }

  try {
    const resumes = await models.Resume.findAll({
      where: whereObj,
      offset: (pageAsNum - 1) * limit,
      limit,
      order: [['lastUpdatedAt', 'DESC']],
    });

    res.json(resumes);
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

router.get('/resume-details/:resumeUuid', async (req, res) => {
  const { resumeUuid } = req.params;
  try {
    const resume = await models.Resume.findOne({
      where: {
        uuid: resumeUuid,
      },
    });

    return res.json(resume);
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.get('/post-resume/preview/:userUuid', isAuthorized, async (req, res) => {
  const { userUuid } = req.params;
  try {
    const resume = await models.Resume.findOne({
      where: {
        userUuid: userUuid,
      },
      // specify attributes when you know more
    });

    return res.json(resume);
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.post(
  '/post-resume/publish/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { userUuid } = req.params;
    try {
      const resume = await models.Resume.findOne({
        where: {
          userUuid: userUuid,
        },
        // specify attributes when you know more
      });
      await resume.update({
        isPublished: true,
        lastUpdatedAt: new Date(),
      });
      return res.json({ error: false, message: 'Resume Published' });
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
      });
    }
  }
);

module.exports = router;
