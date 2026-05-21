import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const LandingHero = ({ config }) => (
  <section className="bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
        {config?.heroHeadline || 'Smart Business Management'}
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {config?.heroSubtext || 'Manage your entire business from one platform'}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link to="/register"><Button size="lg">{config?.registerButtonLabel || 'Get Started'}</Button></Link>
        <Link to="/login"><Button variant="outline" size="lg">{config?.launchButtonLabel || 'Launch'}</Button></Link>
      </div>
      {config?.moduleTags && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {config.moduleTags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </section>
);
export default LandingHero;