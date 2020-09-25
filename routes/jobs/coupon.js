var models = require('../../models');
var router = require('express').Router();
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/coupons', async (req, res) => {
  const codes = await models.Coupon.findAll({
    where: {
      isUsed: false,
    },
    attributes: ['uuid', 'isUsed'],
  });

  return res.json(codes);
});

// router.post('/coupons/create', async (req, res) => {
//   const coupon = models.Coupon.build({});

//   await coupon.save();

//   return res.json(coupon);
// });

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
