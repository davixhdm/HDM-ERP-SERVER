const aiGateway = require('./aiGatewayService');
const LandingPageConfig = require('../models/public/LandingPageConfig');

const handleLandingChat = async (question) => {
  const config = await LandingPageConfig.findOne();
  const landingConfig = {
    paymentMethods: config?.paymentMethods || [],
    locations: config?.locations || [],
    contacts: config?.contacts || {},
    features: config?.features || [],
    pricingSummary: config?.pricingSummary || 'Free trial available'
  };
  return aiGateway.landingQuery(question, landingConfig);
};

module.exports = { handleLandingChat };