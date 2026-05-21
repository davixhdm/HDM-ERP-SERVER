const express = require('express');
const router = express.Router();
const { getUsers, inviteUser, updateUser, deleteUser } = require('../../controllers/tenant/usersController');
const companyAdminAuth = require('../../middleware/tenant/companyAdmin');
const { checkUserLimit } = require('../../middleware/tenant/planLimit');

// All user management requires company admin
router.use(companyAdminAuth);

// GET /api/tenant/users
router.get('/', getUsers);

// POST /api/tenant/users (with user limit check)
router.post('/', checkUserLimit, inviteUser);

// PUT /api/tenant/users/:id
router.put('/:id', updateUser);

// DELETE /api/tenant/users/:id
router.delete('/:id', deleteUser);

module.exports = router;