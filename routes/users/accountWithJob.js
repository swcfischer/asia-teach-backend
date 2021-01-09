const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
const { Op } = require('sequelize');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const models = require('../../models');
const { isAuthorized } = require('../util');

const saltRounds = 10;

// ! I saw Dave Ed doing object validation with JOI
// ! something worth considering

const notActive = { post: () => undefined, get: () => undefined };

notActive.post('/register', async (req, res) => {
  const { email, password, password2 } = req.body;

  if (password2) {
    return res.json({
      error: true,
      message: 'Invalid inputs',
    });
  }

  bcrypt.hash(password, saltRounds, async function (err, hash) {
    const user = await models.User.build({
      uuid: uuidv4(),
      email,
      password: hash,
    });

    try {
      await user.save();
    } catch (e) {
      return res.json({
        error: true,
        message: 'That email is already in use',
      });
    }

    // ! set expiration on jwt
    jwt.sign(
      { data: user.uuid },
      process.env.email_secret,
      { expiresIn: '2d' },
      async (err, emailToken) => {
        if (err) {
          throw new Error(err.message);
        }
        try {
          let url;
          if (process.env.NODE_ENV === 'production') {
            url = `https://www.asia-teach.com/confirmation/${emailToken}`;
          } else {
            url = `http://localhost:3000/confirmation/${emailToken}`;
          }
          const msg = {
            to: email,
            from: 'Hello@asia-teach.com',
            subject: 'Confirmation Email from Asia Teach',
            text: `Hello! \nUse this link to verify your email: ${url}`,
            html: `Hello!<br /><p>Please use this link to verify your email <a href=${url}>here</a>.</p>`,
          };
          await sgMail.send(msg);

          return res.json({
            error: false,
            message: 'Confirmation email was sent to ' + user.email,
          });
        } catch (e) {
          console.log('here!!!!', e);
          return res.json({
            error: true,
            message: e.message,
          });
        }
      }
    );
  });
});

notActive.post('/confirmation/', async (req, res) => {
  const { token } = req.body;

  jwt.verify(token, process.env.email_secret, async (err, verified) => {
    if (!verified) {
      return res.json({
        error: true,
        message: err.message,
      });
    }
    const user = await models.User.findOne({
      where: {
        uuid: verified.data,
      },
    });

    if (!user) {
      return res.json({
        error: true,
        message: 'User not found',
      });
    }
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: verified.data,
      },
    });

    user.confirmed = true;
    user.customerId = customer.id;

    await user.save();

    return res.json({
      error: false,
      message: 'Account confirmation successful',
    });
  });
});

router.post('/create-account-with-job', async (req, res) => {
  // Check if email exists
  // create account if it doesn't
  // use account userUuid to make a job
  // send link through email to confirm account and add photos
  const { email, slug, jobDetails, company } = req.body;
  let user;
  try {
    user = await models.User.findOne({
      where: {
        email,
      },
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }

  if (!user) {
    bcrypt.hash(email, saltRounds, async function (err, hash) {
      const newUser = await models.User.build({
        uuid: uuidv4(),
        email,
        password: hash,
      });

      await newUser.save();
      // I need to pull certain data from the webpage,
      // that includes, ageGroup, startDate, duration, city and replace the email in the fetched html

      const job = await models.Job.build({
        userUuid: newUser.uuid,
        companyName: company,
        email,
        ageGroup: 'Children',
        duration: 12,
        descriptionHTML: jobDetails,
        country: 'china',
        isPublished: true,
        startDate: 'February',
        publishedDate: Date.now(),
      });

      await job.save();

      res.json({
        error: false,
        newUser,
        job,
      });
    });
    // create account
  } else {
    // create job and link to this account
    return res.json({
      error: false,
      user: user,
      email,
      slug,
    });
  }
});

module.exports = router;
