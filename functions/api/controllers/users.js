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
    firstName, lastName, email, password
  } = req.body;
  if (!firstName || !lastName) {
    next(Error(`Missing ${!firstName ? 'first' : 'last'} name`));
  }
  console.log(password);
  const passwordHash = bcrypt.hashSync(password, 5);
  const ownedColonies = [];
  const sharedColonies = [];

  await dataService.createUser({
    name: {
      first: firstName,
      last: lastName,
      full: `${firstName} ${lastName}`,
    },
    email,
    ownedColonies,
    sharedColonies,
    passwordHash,
  }).then((userDetails) => {
    const { email } = userDetails;
    delete userDetails.passwordHash;
    const authToken = jwt.createToken({ email });
    const origin = req.headers.origin;
    console.log(origin);
    res
      .setHeader('Access-Control-Allow-Origin', origin)
      .setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      .setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,HEAD,PUT,OPTIONS')
      .cookie('session', authToken, { sameSite: 'none', secure: true })
      .status(200)
      .json(userDetails);
  }).catch((err) => {
    next(Error(`Unable to register user at this time: ${err.toString()}`));
  });
};

module.exports = { createUser, currentUser };
