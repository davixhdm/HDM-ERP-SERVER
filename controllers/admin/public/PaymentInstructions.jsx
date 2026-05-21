const PaymentInstructions = ({ method }) => {
  const instructions = {
    mpesa_send_money: 'Send the exact amount to 0768784909 (Davix HDM) via M-Pesa. Use your registration email as reference.',
    mpesa_paybill: 'Pay to Business Number 247247, Account Name: HDM ERP.',
    mpesa_till: 'Pay to Till Number 123456, Business Name: HDM ERP.',
  };
  return <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{instructions[method] || 'Follow the payment instructions.'}</p>;
};
export default PaymentInstructions;