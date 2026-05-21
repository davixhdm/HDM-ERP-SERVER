const express = require('express');
const router = express.Router();
const { getContacts, createContact, updateContact, deleteContact } = require('../../controllers/tenant/contactsController');

// GET /api/tenant/contacts
router.get('/', getContacts);

// POST /api/tenant/contacts
router.post('/', createContact);

// PUT /api/tenant/contacts/:id
router.put('/:id', updateContact);

// DELETE /api/tenant/contacts/:id
router.delete('/:id', deleteContact);

module.exports = router;