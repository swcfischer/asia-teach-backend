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
  '/webhooks',
  bodyParser.raw({ type: 'application/json' }),
  (request, response) => {
    const event = request.body;
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('paymentIntent', paymentIntent);
        console.log('PaymentIntent was successful!');
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('PaymentMethod was attached to a Customer!');
        break;
      // ... handle other event types
      default:
      // Unexpected event type
      // return response.status(400).end();
    }

    // Return a 200 response to acknowledge receipt of the event

    return response.json({ received: true });
  }
);

router.post('/sub-intent', async (req, res) => {
  const { userUuid } = req.body;
  try {
    const user = await models.User.findOne({
      where: {
        uuid: userUuid,
      },
    });

    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      customer: user.customerId,
    });

    return res.json({
      client_secret: setupIntent.client_secret,
      customerId: user.customerId,
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.post('/sub-payment', async (req, res) => {
  const { customerId, paymentMethodId, userUuid } = req.body;

  try {
    const user = await models.User.findOne({
      where: {
        uuid: userUuid,
      },
    });
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ plan: process.env.SUBSCRIPTION_PLAN_ID }],
      expand: ['latest_invoice.payment_intent'],
    });

    await user.update({
      subscriptionId: subscription.id,
    });

    res.send(subscription);
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

router.post('/check-sub', async (req, res) => {
  const { subscriptionId } = req.body;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return res.json({
      error: false,
      status: subscription.status,
    });
  } catch (e) {
    return res.json({
      error: true,
      message: e.message,
    });
  }
});

module.exports = router;
