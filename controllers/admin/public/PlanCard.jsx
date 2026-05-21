import Button from '../ui/Button';
import formatCurrency from '../../utils/formatCurrency';

const PlanCard = ({ plan, onSelect, selected }) => (
  <div className={`border rounded-lg p-6 ${selected ? 'border-primary-500 shadow-md ring-1 ring-primary-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.displayName}</h3>
    <p className="mt-2 text-3xl font-bold text-primary-500">
      {formatCurrency(plan.pricing.monthly, plan.displayCurrency)}
      <span className="text-base font-normal text-gray-500">/mo</span>
    </p>
    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <li>✔ {plan.limits.maxUsers} users</li>
      <li>✔ {plan.limits.maxStorageGB} GB storage</li>
      {plan.modules.manufacturing && <li>✔ Manufacturing</li>}
      {plan.modules.aiSparkle && <li>✔ AI Assistant</li>}
    </ul>
    <Button className="mt-6 w-full" variant={selected ? 'primary' : 'outline'} onClick={() => onSelect(plan.name)}>
      {selected ? 'Selected' : 'Choose Plan'}
    </Button>
  </div>
);
export default PlanCard;