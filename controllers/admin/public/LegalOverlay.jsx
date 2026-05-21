import Modal from '../ui/Modal';

const LegalOverlay = ({ open, onClose, title, content }) => (
  <Modal open={open} onClose={onClose} title={title}>
    <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">{content}</div>
  </Modal>
);
export default LegalOverlay;