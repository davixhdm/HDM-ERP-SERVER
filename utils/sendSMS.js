const sendSMS = async (to, content) => {
  console.log(`SMS to ${to}: ${content}`);
  return { success: true };
};

module.exports = sendSMS;