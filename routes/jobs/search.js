var models = require('../../models');
var router = require('express').Router();
var { countries } = require('../../util');

// * Reads all cities for a certain country -- for the select in search
router.get('/jobs/cities/:country', async (req, res) => {
  const { country } = req.params;
  try {
    const cities = await models.Job.findAll({
      where: {
        country,
        isPublished: true,
      },
      attributes: [
        // specify an array where the first element is the SQL function and the second is the alias
        [models.Sequelize.fn('DISTINCT', models.Sequelize.col('city')), 'city'],

        // specify any additional columns, e.g. country_code
        // 'country_code'
      ],

      order: [['city', 'ASC']],
    });
    return res.json(cities);
  } catch (err) {
    return res.json({
      error: true,
      message: err.message,
    });
  }
});

// * Reads jobs base on criteria -- has pagination
const limit = 12; // 10 search results
router.get('/filter-jobs', async (req, res) => {
  const { country, city, ageGroup, page } = req.query;
  const pageAsNum = page ? Number(page) : 1;

  if (!countries.includes(country)) {
    return res.json({
      error: true,
      message: 'That is not a country we have in our search',
    });
  }

  const whereIterator = { ageGroup, country, city, isPublished: true };
  const whereObj = {};
  for (name in whereIterator) {
    if (whereIterator[name]) {
      whereObj[name] = whereIterator[name];
    }
  }

  try {
    const jobs = await models.Job.findAll({
      where: whereObj,
      offset: (pageAsNum - 1) * limit,
      limit,
      order: [['publishedDate', 'DESC']],
    });

    res.json(jobs);
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

// * Reads a certain job -- for search SHOULD BE MOVED
router.get('/job/:uuid', async (req, res) => {
  const { uuid } = req.params;
  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
      attributes: [
        'companyName',
        'descriptionHTML',
        'city',
        'country',
        'ageGroup',
        'duration',
        'createdAt',
        'startDate',
        'classSize',
        'pay',
        'thumbnail',
        'email',
        'link',
        'uuid',
        'favoritedBy',
      ],
    });
    return res.json({
      job,
    });
  } catch (err) {
    return res.json({
      error: true,
      message: 'This job does not exist',
    });
  }
});

router.get('/job/images/:uuid', async (req, res) => {
  const { uuid } = req.params;

  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
      attributes: ['images'],
    });

    return res.json(job);
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.post('/job/clicks', async (req, res) => {
  const { uuid } = req.body;
  try {
    const job = await models.Job.findOne({ where: { uuid } });

    if (!job) {
      throw new Error("This job doesn't exist");
    }

    await job.update({
      numberOfClicks: job.numberOfClicks + 1,
    });

    return res.json({
      error: false,
      message: 'Click logged',
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.post('/job/time', async (req, res) => {
  const { timeSpent, uuid } = req.body;
  console.log(timeSpent, uuid);

  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
      attributes: ['timeSpent', 'uuid'],
    });

    if (!job) {
      throw new Error('Job does not exist');
    }

    await job.update({
      timeSpent: job.timeSpent + timeSpent,
    });

    return res.json({
      error: false,
      message: 'Success',
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

module.exports = router;
