const stripeService = require('../../services/stripeService');
const logger = require('../../utils/logger');

/**
 * @desc    Stripe webhook
 * @route   POST /api/webhooks/stripe
 * @access  Public
 */
const stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripeService.handleWebhook(req.body, sig);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tenantId = session.metadata?.tenantId;
      if (tenantId) {
        const PendingActivation = require('../../models/master/PendingActivation');
        await PendingActivation.findOneAndUpdate(
          { tenant: tenantId, status: 'pending' },
          { paymentConfirmed: true, paymentMethod: 'stripe' }
        );
      }
    }
    res.json({ received: true });
  } catch (err) {
    logger.warn('Stripe webhook error:', err.message);
    res.status(400).json({ success: false, message: 'Webhook error' });
  }
};

/**
 * @desc    M-Pesa webhook (stub)
 * @route   POST /api/webhooks/mpesa
 * @access  Public
 */
const mpesaWebhook = async (req, res) => {
  try {
    // Parse M-Pesa callback, update payment status accordingly
    logger.info('M-Pesa callback received', req.body);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    logger.warn('M-Pesa webhook error:', err.message);
    res.status(400).json({ ResultCode: 1, ResultDesc: 'Error' });
  }
};

module.exports = { stripeWebhook, mpesaWebhook };