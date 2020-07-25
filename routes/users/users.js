const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const models = require('../../models');
const { isAuthorized } = require('../util');

const saltRounds = 10;

// ! I saw Dave Ed doing object validation with JOI
// ! something worth considering

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

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
            url = `https://stunning-denali-preserve-57189.herokuapp.com/confirmation/${emailToken}`;
          } else {
            url = `http://localhost:3000/confirmation/${emailToken}`;
          }
          const msg = {
            to: email,
            from: 'Hello@asiateach.io',
            subject: 'Confirmation Email from Asia Teach',
            text: `Hi there \nUse this link to verify your email: ${url}`,
            html: `<b>Hi there</b><br /><p>Use this link to verify your email <a href=${url}>Here is the link</a></p>`,
          };
          await sgMail.send(msg);

          return res.json({
            error: false,
            message: 'Confirmation email was sent to ' + user.email,
          });
        } catch (e) {
          return res.json({
            error: true,
            message: e.message,
          });
        }
      }
    );
  });
});

// router.post('/register', async (req, res) => {
//   const { email, password } = req.body;

//   bcrypt.hash(password, saltRounds, async function (err, hash) {
//     const user = await models.User.build({
//       uuid: uuidv4(),
//       email,
//       password: hash,
//     });

//     try {
//       await user.save();
//     } catch (e) {
//       return res.json({
//         error: true,
//         message: 'That email is already in use',
//       });
//     }

//     // ! set expiration on jwt
//     jwt.sign(
//       { data: user.uuid },
//       process.env.email_secret,
//       { expiresIn: '2d' },
//       async (err, emailToken) => {
//         try {
//           let url;
//           if (process.env.NODE_ENV === 'production') {
//             url = `https://historic-arches-33577.herokuapp.com/confirmation/${emailToken}`;
//           } else {
//             url = `http://localhost:3000/confirmation/${emailToken}`;
//           }

//           let transporter = nodemailer.createTransport({
//             host: 'mail.privateemail.com',
//             port: 465,
//             secure: true, // true for 465, false for other ports
//             auth: {
//               user: process.env.EMAIL,
//               pass: process.env.EMAIL_PASS,
//             },
//           });

//           let info = await transporter.sendMail({
//             from: '"Asia Teach" <hello@asiateach.io>', // sender address
//             to: `${email}, ${email}`, // list of receivers
//             subject: 'Confirmation Email -- Asia Teach', // Subject line
//             text: `Hi there,\n \n Use this link to verify your email ${url}`, // plain text body
//             html: `<b>Hi there</b>
//                <br />
//                <p>Use this link to verify your email <a href=${url}>Here is the link</a></p>`, // html body
//           });

//           console.log('Message sent: %s', info.messageId);
//           console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

//           return res.json({
//             error: false,
//             message: 'Confirmation email was sent to ' + user.email,
//           });
//         } catch (e) {
//           return res.json({
//             error: true,
//             message: e.message,
//           });
//         }
//       }
//     );
//   });
// });

router.post('/confirmation/', async (req, res) => {
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

router.get('/users', async (req, res) => {
  const users = await models.User.findAll({
    attributes: ['uuid', 'email'],
  });

  res.json(users);
});

router.get('/user/:uuid/jobs', async (req, res) => {
  const { uuid } = req.params;
  try {
    const jobs = await models.Job.findAll({
      where: {
        userUuid: uuid,
      },
    });
    return res.json(jobs);
  } catch (err) {}
});

router.get('/current_user', async (req, res) => {
  const authorization = req.header('authorization');
  if (!authorization) {
    return res.json({
      currentUser: null,
    });
  }

  const token = authorization.split(' ')[1];

  try {
    const verified = await jwt.verify(token, process.env.secret);
    // ! this is the user's id
    // ! I'm not sure if I want req.user
    // ! or if I want to do it through the client via the redux store
    if (verified) {
      const user = await models.User.findOne({
        where: {
          uuid: verified.data,
        },
        attributes: ['email', 'confirmed', 'uuid', 'subscriptionId'],
      });
      return res.json({ currentUser: user });
    } else {
      res.json({ currentUser: null });
    }
  } catch (err) {
    console.log(err);
    return res.json({
      error: true,
      message: err.message,
      currentUser: null,
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await models.User.findOne({
    where: {
      email,
    },
    attributes: ['uuid', 'confirmed', 'email', 'password', 'subscriptionId'],
  });

  if (!user) {
    return res.json({
      error: true,
      message: 'Email or password was incorrect',
    });
  }
  if (!user.confirmed) {
    return res.json({
      error: true,
      message: 'You must verify your email before you login',
    });
  }
  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.json({
        error: true,
        message: 'Email or password was incorrect',
      });
    }

    // ! set expiration on jwt
    jwt.sign(
      { data: user.uuid },
      process.env.secret,
      { expiresIn: '365d' },
      (err, token) => {
        console.log(err);
        res.set('Auth-Token', token);
        return res.json({
          currentUser: {
            email: user.email,
            uuid: user.uuid,
            confirmed: user.confirmed,
            subscriptionId: user.subscriptionId,
          },
        });
      }
    );
  });
});

router.get('/forgot-password', async (req, res) => {
  const { email } = req.query;
  // this will send an email with a 2 day expiration jwt

  const user = await models.User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return res.json({
      error: true,
      message: 'That email does not exist',
    });
  }

  jwt.sign(
    { data: user.uuid },
    process.env.EMAIL_FORGOT_PASS_SECRET,
    { expiresIn: '2d' },
    async (err, emailToken) => {
      if (err) {
        return res.json({
          error: true,
          message: err.message,
        });
      }

      const url =
        process.env.NODE_ENV === 'production'
          ? `https://historic-arches-33577.herokuapp.com/change-password/${emailToken}`
          : `http://localhost:3000/change-password/${emailToken}`;

      const msg = {
        from: 'Hello@asiateach.io',
        to: email,
        subject: 'Forgot Password Email',
        text: `Hi there,\n \n Use this link to enter in a new password ${url}`,
        html: `<b>Hi there</b>
           <br />
           <p>
            Use this link to enter in a new password <a href=${url}>Here is the link</a>
            <br />
            This link will expire in two days.
           </p>`,
      };
      await sgMail.send(msg);

      return res.json({
        error: false,
        message: 'Email was sent successfully',
      });
    }
  );
});

router.post('/set-forgot-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  try {
    if (!password || !confirmPassword) {
      throw new Error('Must provide passwords');
    }
    const verified = await jwt.verify(
      token,
      process.env.EMAIL_FORGOT_PASS_SECRET
    );

    const userUuid = verified.data;

    const user = await models.User.findOne({
      where: {
        uuid: userUuid,
      },
    });

    bcrypt.hash(password, saltRounds, async function (err, hash) {
      if (err) {
        throw new Error(err.message);
      }

      await user.update({
        password: hash,
      });

      res.json({
        error: false,
        message: 'Password has been set',
      });
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.get('/user/:userUuid', isAuthorized, async (req, res) => {
  const { userUuid } = req.params;

  try {
    const user = await models.User.findOne({
      where: {
        uuid: userUuid,
      },
      attributes: ['email', 'confirmed'],
    });

    res.json(user);
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

router.post('/contact-us', async (req, res) => {
  const { email, text } = req.body;

  try {
    const msg = {
      from: 'Hello@asiateach.io',
      to: 'Hello@asiateach.io',
      subject: 'Contact Us ' + email,
      text,
    };
    await sgMail.send(msg);

    res.json({
      error: false,
      message: 'Message sent',
    });
  } catch (err) {
    res.json({
      error: true,
      message: err.message,
    });
  }
});

module.exports = router;
