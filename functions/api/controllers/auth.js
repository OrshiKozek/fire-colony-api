const { pick } = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('../services/jwt');
const dataService = require('../services/database');

const login = async (req, res) => {
  const { body: { email, password } } = req;
  /* Verify that a user exists in the database with the given username
   * and password combination
   */
  const user = await dataService.getUser(email).catch((err) => { next(Error(`Unable to register user at this time: ${err.toString()}`));   }); 

  try {
    /* Only return the details we need, otherwise we start leaking data like
      * hashed passwords (or in our case unhashed passwords!!)
      */
    const userDetails = pick(user, ['name', 'email', 'ownedColonies', 'sharedColonies']);
    const ownedColoniesMeta = await dataService.getColonies(userDetails.ownedColonies);
    const sharedColoniesMeta = await dataService.getSharedColonies(userDetails.sharedColonies);

    const pass = pick(user, 'passwordHash');

    if (!bcrypt.compareSync(password, pass.passwordHash)) {
      throw new Error('Invalid Password');
    }

    const { email } = userDetails;
    const authToken = jwt.createToken({ email });

    userDetails.ownedColonies = ownedColoniesMeta;
    userDetails.sharedColonies = sharedColoniesMeta;

    res.cookie('session', authToken).status(200).json(userDetails);
  } catch (err) {
    res.sendStatus(401);
  }
};

module.exports = {
  login,
};
