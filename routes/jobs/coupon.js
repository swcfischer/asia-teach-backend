var models = require('../../models');
var router = require('express').Router();
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
const bodyParser = require('body-parser');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get('/coupons', async (req, res) => {
  const codes = await models.Coupon.findAll({
    where: {
      country: 'Japan',
    },
    attributes: ['uuid', 'isUsed', 'country', 'company', 'emailSent'],
  });

  return res.json(codes);
});

// router.post('/coupons/create', async (req, res) => {
//   const coupon = models.Coupon.build({});

//   await coupon.save();

//   return res.json(coupon);
// });

// const testEmails = [
//   { email: 'swcfischer@gmail.com', country: 'Japan', company: 'Asia-Teach' },
//   { email: 'zswcfischer@gmail.com', country: 'Japan', company: 'Asia-Teach' },
// ];

const testBody = {
  pass: 'c0c1291e-8191-49b3-becb-d638abf1e311',
  emailArr: [
    { email: 'swcfischer@gmail.com', country: 'Japan', company: 'Asia-Teach' },
    { email: 'zswcfischer@gmail.com', country: 'Japan', company: 'Asia-Teach' },
  ],
};

router.post('/coupon/send-emails', async (req, res) => {
  let { emailArr, pass } = testBody;

  if (pass !== 'c0c1291e-8191-49b3-becb-d638abf1e311') {
    return res.json({
      error: true,
      message: 'Wrong pass',
    });
  }

  if (!emailArr || !Array.isArray(emailArr)) {
    return res.json({
      error: true,
      message: 'Must provide emailArr in body',
    });
  }

  const { length } = emailArr;
  // * code passcode c0c1291e-8191-49b3-becb-d638abf1e311
  /*
    {
      email,
      country,
      company
    }, ...
  */

  try {
    const coupons = await models.Coupon.findAll({
      where: {
        isUsed: false,
        emailSent: '',
        isSent: false,
      },
      limit: length,
    });

    for (let i = 0; i < length; i++) {
      const { email, country, company } = emailArr[i];
      const couponInstance = coupons[i];
      const code = couponInstance.uuid;
      const url =
        process.env.NODE_ENV === 'production'
          ? `https://www.asia-teach.com/special-register/${code}`
          : `http://localhost:3000/special-register/${code}`;

      const msg = {
        from: 'Hello@asia-teach.com',
        to: email,
        subject: 'Free Job Posting at Asia-Teach',
        text: `Hello!\n \n The below link gives you a free job posting on Asia-Teach. Please reach out if you have any questions. We look forward to connecting you with your future English Teacher!\n Please use this link to create your account ${url}`,
        html: `<p style="color:#000;">Hello!</p>
           <p style="color:#000;">
           The below link gives you a <strong>free job posting on Asia-Teach</strong>. 
           <br/>
           <br />
           Please reach out if you have any questions. We look forward to connecting you with your future English teacher!
           <br />
           <br />
           Please use this <strong><a href=${url}>link</a></strong> to create your account.
           </p>
           <p style="color:#000;">Thank you!
           <br />
           <br />
           <strong>Asia-Teach</strong>
           </p>`,
      };
      await couponInstance.update({
        emailSent: email,
        company,
        country,
        isSent: true,
      });
      await sgMail.send(msg);
    }

    return res.json({
      error: false,
      message: 'Emails sent!',
    });
  } catch (err) {
    return res.json({
      error: true,
      message: err.message,
    });
  }
});

const saltRounds = 10;

router.post('/coupon/create-account-with-job', async (req, res) => {
  // first check code, which should come from url
  const { code } = req.body;
  const { email, password, password2: honepot } = req.body;

  if (honepot) {
    return res.json({
      error: true,
      message: 'Invalid inputs',
    });
  }

  try {
    const coupon = await models.Coupon.findOne({
      where: {
        uuid: code,
      },
    });
    if (!coupon) {
      return res.json({
        error: true,
        messsage: 'This is a not a valid coupon code.',
      });
    } else if (coupon.isUsed) {
      return res.json({
        error: true,
        message: 'This coupon code is already used',
      });
    }

    bcrypt.hash(password, saltRounds, async function (err, hash) {
      try {
        const user = await models.User.build({
          uuid: uuidv4(),
          email,
          password: hash,
          confirmed: true,
        });
        await user.save();

        await coupon.update({
          isUsed: true,
          email,
        });
        const customer = await stripe.customers.create({
          email,
          metadata: {
            userId: user.uuid,
          },
        });
        user.customerId = customer.id;

        const job = models.Job.build({
          userUuid: user.uuid,
        });

        await job.save();
        jwt.sign(
          { data: user.uuid },
          process.env.secret,
          { expiresIn: '365d' },
          (err, token) => {
            console.log(err);
            res.set('Auth-Token', token);
            return res.json({
              message: 'Account created successfully',
              currentUser: {
                email: user.email,
                uuid: user.uuid,
                confirmed: user.confirmed,
                subscriptionId: user.subscriptionId,
              },
            });
          }
        );
      } catch (e) {
        return res.json({
          error: true,
          message: e.message,
        });
      }

      // ! set expiration on jwt
    });
  } catch (e) {
    res.json({
      error: true,
      message: 'Invalid coupon',
    });
  }
});

module.exports = router;
