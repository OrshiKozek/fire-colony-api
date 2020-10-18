const { Router } = require('express');
const userRouter = require('./users');
const colonyRouter = require('./colonies');
const animalRouter = require('./animals');
const tagRouter = require('./tags');
const authController = require('../controllers/auth');

const router = Router();

/**
 * Debug route to check if server is up
 */
router.get('/ping', (req, res) => {
  res.status(418).send('pong');
});

/**
 * Route used to login and authenticate a user
 */
router.post('/login', authController.login);


/**
 * Namespaced router so all routes in the userRouter will fall under the namespace
 * api/user/{routeName}
 */
router.use('/user', userRouter);

router.use('/colony', colonyRouter);
router.use('/animals', animalRouter);
router.use('/tags', tagRouter);

module.exports = router;
