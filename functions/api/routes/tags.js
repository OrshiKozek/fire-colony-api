const { Router } = require('express');
const { auth } = require('firebase-admin');
const tagController = require('../controllers/tags');
const authentication = require('../middleware/auth');

const router = Router();

router.post('/getTag', authentication, tagController.getOneTag);
router.post('/createTag', authentication, tagController.createTag);


module.exports = router;
 