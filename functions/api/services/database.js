const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("../../animal-colony-76d9b-firebase-adminsdk-egbh6-ac4894dd6b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://animal-colony-61928.firebaseio.com"
});

let db = admin.firestore();

/**
 * Sends a user's registration information to the mock database and returns
 * the desired registration information upon successful insertion
 * @param registrationInformation
 * @returns {Promise<Object>}
 */
const createUser = async (registrationInformation) => {
  const { username } = registrationInformation;
  await db.collection('users').doc(username).set(registrationInformation);
  return registrationInformation;
};

/**
 * Retrieves user details from the mock database based on a given username
 * @param username
 * @returns {Promise<Object>}
 */
const getUser = async (username) => {
  const user = await db.collection('users').doc(username).get();
  return user.data();
};

/**
 * Adds initial colony meta data to the database with a generated 
 * uuid for the colony. This uuid is added to the user's profile.
 *
 * @param username - username of person creating this colony
 * @param colonyInfo - Initial colony meta data
 *
 * @return colony.id - uuid of new colony
 */
const addColony = async (username, colonyInfo) => {
  const colony = db.collection('colonies').doc();
  addColonyToUser(username, colony.id); 
  await colony.set(colonyInfo);
  return colony.id;
};

/**
 * Adds an animal to a colony's animal list.
 *
 * @param colonyId - uuid of colony where animal should be placed
 * @param animalInfo - json object of the animal
 *
 */
const addAnimal = async (colonyId, animalInfo) => {
  const colony = db.collection('colonies').doc(colonyId);
  colony.update({
    size: admin.firestore.FieldValue.increment(1),
    animals: admin.firestore.FieldValue.arrayUnion(animalInfo)
  });
};

/**
 * Adds a colony uuid to a users ownedColonies
 *
 * @param username - user's username
 * @param colonyId - uuid of colony to add to profile
 */
const addColonyToUser = async (username, colonyId) => {
  const user = db.collection('users').doc(username);
  user.update({
    ownedColonies: admin.firestore.FieldValue.arrayUnion(colonyId)
  });
};

module.exports = { createUser, getUser, addColony, addAnimal, addColonyToUser };
