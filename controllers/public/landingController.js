const LandingPageConfig = require('../../models/public/LandingPageConfig');
const SystemSettings = require('../../models/master/SystemSettings');
const Plan = require('../../models/master/Plan');
const logger = require('../../utils/logger');

/**
 * @desc    Get landing page configuration
 * @route   GET /api/public/landing
 * @access  Public
 */
const getLandingConfig = async (req, res) => {
  try {
    const [config, settings, plans] = await Promise.all([
      LandingPageConfig.findOne(),
      SystemSettings.findOne(),
      Plan.find({ enabled: true }).sort({ sortOrder: 1 })
    ]);

    const general = settings?.general || {};
    const branding = settings?.branding || {};
    const footer = config?.footer || {};

    res.json({
      success: true,
      data: {
        systemName: general.systemName || 'HDM ERP',
        heroHeadline: config?.heroHeadline || general.tagline || 'Smart Business Management',
        heroSubtext: config?.heroSubtext || 'Manage your entire business from one platform',
        moduleTags: config?.moduleTags || [],
        launchButtonLabel: config?.launchButtonLabel || 'Launch',
        registerButtonLabel: config?.registerButtonLabel || 'Get Started',
        aboutText: config?.aboutText || settings?.landingPage?.aboutText || '',
        contactEmail: general.contactEmail || 'support@hdmerp.com',
        contactPhone: general.contactPhone || '+254 700 000 000',
        address: general.address || 'Nairobi, Kenya',
        maintenanceMode: general.maintenanceMode || false,
        maintenanceMessage: general.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
        faqs: config?.faqs || { questions: [] },
        payments: settings?.payments || {},
        desktopApp: settings?.downloads?.desktop || { enabled: false, url: '', label: 'Download for Desktop' },
        mobileApp: settings?.downloads?.mobile || { enabled: false, url: '', label: 'Get on Mobile' },
        footer: {
          copyright: footer.copyright || '© 2026 HDM ERP',
          supportEmail: footer.supportEmail || general.contactEmail,
          supportPhone: footer.supportPhone || general.contactPhone
        },
        branding: {
          primaryColor: branding.primaryColor || '#10B981',
          secondaryColor: branding.secondaryColor || '#1E3A5F',
          logoNavbar: branding.logoNavbar || ''
        },
        plans
      }
    });
  } catch (err) {
    logger.error('Landing config error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getLandingConfig };