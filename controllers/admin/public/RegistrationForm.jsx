import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const RegistrationForm = ({ plans, onSubmit }) => {
  const [form, setForm] = useState({
    companyName: '',
    contactEmail: '',
    plan: 'free_trial',
    billingCycle: 'monthly',
    paymentMethod: 'mpesa_send_money',
    phone: '',
    transactionId: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.companyName || !form.contactEmail) return setError('Company name and email are required');
    setError('');
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}
      <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Company Name" required />
      <Input name="contactEmail" type="email" value={form.contactEmail} onChange={handleChange} placeholder="Email" required />
      <Select name="plan" value={form.plan} onChange={handleChange}>
        {plans.map((p) => (
          <option key={p.name} value={p.name}>{p.displayName} – {p.pricing.monthly} {p.displayCurrency}/mo</option>
        ))}
      </Select>
      <Select name="billingCycle" value={form.billingCycle} onChange={handleChange}>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
        <option value="permanent">One-Time</option>
      </Select>
      <Select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
        <option value="mpesa_send_money">M-Pesa Send Money</option>
        <option value="mpesa_stk">M-Pesa STK Push</option>
        <option value="stripe">Stripe</option>
      </Select>
      {form.paymentMethod === 'mpesa_stk' && (
        <Input name="phone" value={form.phone} onChange={handleChange} placeholder="M-Pesa phone (07xx)" />
      )}
      <Input name="transactionId" value={form.transactionId} onChange={handleChange} placeholder="Transaction ID (if manual)" />
      <Button type="submit" className="w-full">Complete Registration</Button>
    </form>
  );
};
export default RegistrationForm;