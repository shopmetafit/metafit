const express = require('express');
const router = express.Router();
const { submitContact } = require('../controllers/contactController');
const { validateContactForm } = require('../validators/contact-validator');

router.post('/submit', validateContactForm, submitContact);

module.exports = router;
