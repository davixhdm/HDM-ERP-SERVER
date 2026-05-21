import Modal from '../ui/Modal';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactOverlay = ({ open, onClose, config }) => (
  <Modal open={open} onClose={onClose} title="Contact Us">
    <div className="space-y-4 text-gray-600 dark:text-gray-300">
      <div className="flex items-center gap-3">
        <Mail size={18} className="text-primary-500" />
        <span>{config?.contactEmail || 'support@hdmerp.com'}</span>
      </div>
      <div className="flex items-center gap-3">
        <Phone size={18} className="text-primary-500" />
        <span>{config?.contactPhone || '+254 700 000 000'}</span>
      </div>
      <div className="flex items-center gap-3">
        <MapPin size={18} className="text-primary-500" />
        <span>{config?.address || 'Nairobi, Kenya'}</span>
      </div>
    </div>
  </Modal>
);
export default ContactOverlay;