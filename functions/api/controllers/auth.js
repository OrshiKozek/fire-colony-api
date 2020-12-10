const admin = require('firebase-admin');

const { pick } = require('lodash');
const bcrypt = require('bcrypt');
const jwt = require('../services/jwt');
const dataService = require('../services/database');

const login = async (req, res) => {
  const { body: { idToken } } = req;
  /* Verify that a user exists in the database with the given id
   */
  const user = await admin.auth().verifyIdToken(idToken)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );

    const uid = user.uid;

  const userData = await dataService.getUserByUid(uid)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );

  try {
    /* Only return the details we need, otherwise we start leaking data like
      * hashed passwords (or in our case unhashed passwords!!)
      */
    const userDetails = pick(userData, ['name', 'email', 'ownedColonies', 'sharedColonies']);
    const ownedColoniesMeta = await dataService.getColonies(userDetails.ownedColonies)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((error) => {
        res.sendStatus(404);
        console.log(error)}
      );

    const sharedColoniesMeta = await dataService.getSharedColonies(userDetails.sharedColonies)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((error) => {
        res.sendStatus(404);
        console.log(error)}
      );
      
    userDetails.ownedColonies = ownedColoniesMeta;
    userDetails.sharedColonies = sharedColoniesMeta;

    const { email } = userDetails;
    const authToken = jwt.createToken({ email });

    res.cookie('session', authToken).status(200).json(userDetails);
  } catch (err) {
    res.sendStatus(401);
  }
};

module.exports = {
  login,
};
