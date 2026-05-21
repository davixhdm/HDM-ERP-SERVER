const PaymentMethods = ({ methods, onSelect, selected }) => (
  <div className="grid grid-cols-2 gap-3">
    {methods.map((m) => (
      <button
        key={m.value}
        onClick={() => onSelect(m.value)}
        className={`p-4 border rounded-lg text-sm font-medium ${
          selected === m.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-700' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        {m.label}
      </button>
    ))}
  </div>
);
export default PaymentMethods;