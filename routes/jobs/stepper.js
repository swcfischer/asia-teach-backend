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

// * STEPPER

// * Reads details of unpublished job
router.get('/jobs/details/:uuid/:userUuid', isAuthorized, async (req, res) => {
  const { uuid } = req.params;
  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
      attributes: [
        'companyName',
        'email',
        'country',
        'city',
        'pay',
        'ageGroup',
        'duration',
        'classSize',
        'startDate',
        'phone',
        'link',
      ],
    });
    res.json(job);
  } catch (err) {
    return res.json({
      error: true,
      message: err.message,
    });
  }
});
// * Updates details of unpublished job
router.post('/jobs/details/:uuid/:userUuid', isAuthorized, async (req, res) => {
  const { uuid } = req.params;

  try {
    // double check that this is the best way to update,
    // looks to hit the database twice
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
      attributes: [
        'companyName',
        'email',
        'country',
        'city',
        'pay',
        'ageGroup',
        'duration',
        'classSize',
        'startDate',
        'phone',
        'link',
        'uuid',
      ],
    });

    await job.update(req.body);
    // const job = await models.Job.update(req.body, {
    //   where: {
    //     uuid
    //   }
    // });
    res.json(job);
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

// * Reads initial or saved html for unpublished job
router.get('/job/richtext/:uuid/:userUuid', isAuthorized, async (req, res) => {
  const { uuid } = req.params;
  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
      attributes: ['descriptionHTML'],
    });

    return res.json(job);
  } catch (err) {
    return res.json({
      error: true,
      message: err.message,
    });
  }
});
// * Updates html description for an unpublished job
router.post('/job/richtext/:uuid/:userUuid', isAuthorized, async (req, res) => {
  const { uuid } = req.params;
  const { descriptionHTML } = req.body;
  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
      attributes: ['descriptionHTML', 'uuid'],
    });

    await job.update({
      descriptionHTML,
    });

    return res.json(job);
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

// * Publishes an unpublished job posting
router.post('/job/publish/:uuid/:userUuid', isAuthorized, async (req, res) => {
  const { uuid } = req.params;

  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
    });
    if (!job.isPublished) {
      await job.update({
        isPublished: true,
        publishedDate: Date.now(),
      });
    }

    return res.json(job);
  } catch (err) {
    return res.json({
      error: true,
      message: err.message,
    });
  }
});

// * Get cropped image
router.get(
  '/job/image-crop/:uuid/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { uuid } = req.params;

    try {
      const job = await models.Job.findOne({
        where: {
          uuid,
        },

        attributes: ['thumbnail'],
      });

      return res.json(job);
    } catch (err) {
      return res.json({
        error: true,
        message: err.message,
      });
    }
  }
);

// * Post header image to job

// * I was using this previously
router.post(
  '/job/image-crop/:uuid/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { uuid } = req.params;
    const { thumbnail } = req.body;
    const Bucket = 'asia-teach-header-image-bucket';
    const Key = `thumbnail-${uuid}`; // this is the file's eventual name

    if (!thumbnail) {
      return res.json({
        error: true,
        message: 'thumbnail property in body is undefined',
      });
    }

    const base64Data = new Buffer(
      thumbnail.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    const type = thumbnail.split(';')[0].split('/')[1];

    const params = {
      Bucket,
      Key,
      Body: base64Data,
      ACL: 'public-read',
      ContentEncoding: 'base64', // required
      ContentType: `image/${type}`,
    };

    try {
      const job = await models.Job.findOne({
        where: {
          uuid,
        },
      });
      if (!job.thumbnail) {
        s3.upload(params, async (err, data) => {
          if (err) {
            return res.json({
              error: true,
              message: 'S3 upload error',
            });
          }
          await job.update({
            thumbnail: data.Location,
          });
          return res.json({
            success: true,
            message: 'Image uploaded',
          });
        });
      } else {
        s3.putObject(params, async (err, data) => {
          if (err) {
            return res.json({
              error: true,
              message: 'S3 put error',
            });
          }
          return res.json({
            success: true,
            message: 'Image updated',
          });
        });
      }
    } catch (err) {
      return res.json({
        error: true,
        message: err.message,
      });
    }
  }
);

router.get(
  '/job/image-upload/:uuid/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { uuid } = req.params;

    try {
      const job = await models.Job.findOne({
        where: {
          uuid,
        },
        attributes: ['images'],
      });

      return res.json({
        images: job.images,
      });
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
      });
    }
  }
);

router.post(
  '/job/image-upload/:uuid/:userUuid',
  isAuthorized,
  async (req, res) => {
    const { uuid } = req.params;
    const { images } = req.body;
    // Check whether images in database are present in the array that came from the client that are links
    // this will create an array of images to be deleted
    // next I will upload the images that are base64Images

    // first I will fetch the job itself with its images
    // second I will create an array of images to be deleted
    // delete logic using S3 isntance

    // upload logic using s3 instance
    try {
      // find job
      const job = await models.Job.findOne({
        where: {
          uuid,
        },
        attributes: ['images', 'uuid'],
      });

      if (!job) {
        return res.json({
          error: true,
          message: 'No job found',
        });
      }

      const alreadyUploadedImagesFromClient = images.filter((el) =>
        el.match(/image-carousel-asia-teach/)
      );
      // test images would normally come from db
      // job.images
      console.log('images', images);
      console.log('already', alreadyUploadedImagesFromClient);
      const imagesToBeDeleted = job.images.filter(
        (el) => !alreadyUploadedImagesFromClient.includes(el)
      );
      console.log('imagesToBeDeleted', imagesToBeDeleted);
      const deletePromises = imagesToBeDeleted.map((el) => {
        const params = {
          Bucket: 'image-carousel-asia-teach',
          Key: el.split('/')[3],
        };
        return s3.deleteObject(params).promise();
      });
      const deletePromisesData = await Promise.all(deletePromises);
      console.log('deletePromisesData', deletePromisesData);

      const imagesToBeUploaded = images.filter((el) => el.match(/base64/));

      const imagesToBeUploadedPromises = imagesToBeUploaded.map((el) => {
        const base64Data = new Buffer(
          el.replace(/^data:image\/.*;base64,/, ''),
          'base64'
        );

        const type = el.split(';')[0].split('/')[1];

        const params = {
          Bucket: 'image-carousel-asia-teach',
          Key: `carousel-image-${uuid}-${uuidV4()}`,
          Body: base64Data,
          ACL: 'public-read',
          ContentEncoding: 'base64', // required
          ContentType: `image/${type}`,
        };

        return s3.upload(params).promise();
      });

      const promisesData = await Promise.all(imagesToBeUploadedPromises);
      const newImages = promisesData
        .map((el) => el.Location)
        .concat(alreadyUploadedImagesFromClient);
      await job.update({
        images: newImages,
      });

      return res.json({
        error: false,
        message: 'Images uploaded',
      });
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
      });
    }
  }
);

router.get('/job/preview/:uuid/:userUuid', isAuthorized, async (req, res) => {
  const { uuid, userUuid } = req.params;

  try {
    const job = await models.Job.findOne({
      where: {
        uuid,
      },
    });

    return res.json(job);
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

module.exports = router;
