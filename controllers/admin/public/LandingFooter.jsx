const LandingFooter = ({ config, onOpenLegal, onOpenContact }) => (
  <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-10">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 className="text-white text-lg font-semibold">{config?.systemName || 'HDM ERP'}</h3>
        <p className="mt-2 text-sm">{config?.aboutText?.slice(0, 120)}...</p>
      </div>
      <div>
        <h4 className="text-white font-medium mb-2">Features</h4>
        <ul className="space-y-1 text-sm">
          {(config?.moduleTags || ['Finance','HR','Sales','Inventory']).slice(0,5).map(t => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-white font-medium mb-2">Legal</h4>
        <div className="space-y-1 text-sm">
          <button onClick={() => onOpenLegal('privacy_policy')} className="hover:text-primary-400 block">Privacy Policy</button>
          <button onClick={() => onOpenLegal('terms_of_service')} className="hover:text-primary-400 block">Terms of Service</button>
          <button onClick={() => onOpenLegal('license_agreement')} className="hover:text-primary-400 block">License</button>
          <button onClick={() => onOpenLegal('cookie_policy')} className="hover:text-primary-400 block">Cookie Policy</button>
        </div>
      </div>
      <div>
        <h4 className="text-white font-medium mb-2">Contact</h4>
        <button onClick={onOpenContact} className="text-sm hover:text-primary-400 block">Contact Us</button>
        <p className="text-sm mt-1">{config?.contactEmail || 'support@hdmerp.com'}</p>
        <p className="text-sm">{config?.contactPhone}</p>
      </div>
    </div>
    <div className="text-center text-sm mt-8 border-t border-gray-800 pt-6">
      {config?.footer?.copyright || '© 2026 HDM ERP. All rights reserved.'}
    </div>
  </footer>
);
export default LandingFooter;