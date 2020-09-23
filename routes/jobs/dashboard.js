var models = require('../../models');
var router = require('express').Router();
const { isAuthorized } = require('../util');

// * DASHBOARD

// * Reads all unpublished jobs for a certain user
router.get(
  '/jobs/unpublished/user/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { userUuid } = req.params;

    try {
      const unpublishedJobs = await models.Job.findAll({
        where: {
          userUuid,
          isPublished: false,
        },
        attributes: ['companyName', 'uuid'],
        order: [['createdAt', 'DESC']],
      });

      return res.json({
        unpublishedJobs,
      });
    } catch (err) {
      return res.json({
        error: true,
        message: err.message,
      });
    }
  }
);

// * Reads published jobs
const publishedJobslimit = 4;
router.get('/jobs/published/:userUuid', isAuthorized, async (req, res) => {
  const { userUuid } = req.params;
  const { page } = req.query;
  const pageAsNum = Number(page);

  try {
    const jobs = await models.Job.findAll({
      where: {
        userUuid,
        isPublished: true,
      },
      attributes: [
        'companyName',
        'uuid',
        'country',
        'city',
        'duration',
        'ageGroup',
        'publishedDate',
      ],
      order: [['publishedDate', 'DESC']],
      // offset: pageAsNum * publishedJobslimit,
      // limit: publishedJobslimit,
    });
    return res.json(jobs);
  } catch (err) {
    return res.json({
      error: true,
      message: err.message,
    });
  }
});

router.get('/jobs/unpublished/:userUuid', async (req, res) => {
  const jobs = await models.Job.findAll({
    where: {
      isPublished: true,
      publishedDate: {
        [Op.lt]: moment().subtract(45, 'days').toDate(),
      },
    },
  });
});

module.exports = router;
