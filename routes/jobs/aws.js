const aws = require('aws-sdk');

// ! THIS NEEDS TO BE MADE USE OF
// ! STILL HAVE NOT FINISHED IT

// * I will be creating a class for S3
class S3Handler {
  constructor() {
    aws.config.update({
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      region: 'us-east-1',
    });

    this.s3 = new aws.s3();
  }

  async upload(params) {
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
      return res.json({ success: true, change: true });
    });
  }

  put() {}
}
