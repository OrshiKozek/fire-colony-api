const admin = require('firebase-admin');

const bcrypt = require('bcrypt');

const dataService = require('../services/database');
const jwt = require('../services/jwt');

/**
 * Returns the current authenticated user's details
 * @param req
 * @param res
 */
const currentUser = (req, res) => {
  const { user } = req;
  res.json(user);
};

/**
 * Attempts to create a user with the given registration details
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const createUser = async (req, res, next) => {
  console.log(req.body);

  const {
    body: {
      idToken, firstName, lastName, email,
    },
  } = req;

  const user = await admin.auth().verifyIdToken(idToken)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );
  const uid = user.uid;

  if (!firstName || !lastName) {
    next(Error(`Missing ${!firstName ? 'first' : 'last'} name`));
  }

  const ownedColonies = [];
  const sharedColonies = [];

  await dataService.createUser({
    uid,
    name: {
      first: firstName,
      last: lastName,
      full: `${firstName} ${lastName}`,
    },
    email,
    ownedColonies,
    sharedColonies,
  })
  .then((userDetails) => {
    console.log('then');
    const { email } = userDetails;
    const authToken = jwt.createToken({ email });
    const origin = req.headers.origin;
    console.log(origin);
    res
      .cookie('session', authToken)
      .status(200)
      .json(userDetails);
  })
  .catch((err) => {
    next(Error(`Unable to register user at this time: ${err.toString()}`));
  });
};

module.exports = { createUser, currentUser };
