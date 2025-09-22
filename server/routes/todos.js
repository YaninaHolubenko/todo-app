// server/routes/todos.js
const express = require('express');
const { listForUser, create, update, remove } = require('../controllers/todosController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/:userEmail', auth, listForUser);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
