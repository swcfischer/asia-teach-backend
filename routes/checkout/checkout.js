const stripe = require('stripe')(process.env.stripe_private_key);
const bodyParser = require('body-parser');
var models = require('../../models');
var router = require('express').Router();
const { isAuthorized } = require('../util');

const toCents = 100;

const jobPriceMap = {
  one: 20 * toCents,
  five: 85 * toCents,
  ten: 150 * toCents,
};

router.post('/payments-jobs', async (req, res) => {
  const { userUuid, quantity } = req.body;
  let paymentIntent;
  if (!userUuid || !quantity) {
    return res.json({
      error: true,
      message: 'Data not provided',
    });
  }

  try {
    const user = await models.User.findOne({
      where: { uuid: userUuid },
      attributes: ['uuid', 'customerId'],
    });

    switch (quantity) {
      case 'one':
      case 'five':
      case 'ten':
        paymentIntent = await stripe.paymentIntents.create({
          amount: jobPriceMap[quantity],
          currency: 'usd',
          customer: user.customerId,
          metadata: { integration_check: 'accept_a_payment' },
        });
        break;
      default:
        throw new Error('Invalid quantity');
    }
    return res.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

// Match the raw body to content type application/json
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  (request, response) => {
    const event = request.body;

    console.log(event);
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!');
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('PaymentMethod was attached to a Customer!');
        break;
      // ... handle other event types
      default:
        // Unexpected event type
        return response.status(400).end();
    }

    // Return a 200 response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

module.exports = router;
