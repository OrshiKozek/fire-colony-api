const admin = require('firebase-admin');

const serviceAccount = require('../../animal-colony-project-firebase-adminsdk-5815z-411e5fc735.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://animal-colony-project.firebaseio.com',
});

const db = admin.firestore();

/**
 * Sends a user's registration information to the mock database and returns
 * the desired registration information upon successful insertion
 * @param registrationInformation
 * @returns {Promise<Object>}
 */
const createUser = async (registrationInformation) => {
  const { uid } = registrationInformation;
  await db.collection('users').doc(uid).set(registrationInformation);
  return registrationInformation;
};

/**
 * Retrieves user details from the mock database based on a given uid
 * @param uid
 * @returns {Promise<Object>}
 */
const getUserByUid = async (uid) => {
  const user = await db.collection('users').doc(uid).get();
  return user.data();
};

/**
 * Retrieves user details from the mock database based on a given username
 * @param username
 * @returns {Promise<Object>}
 */
const getUserByEmail = async (email) => {
  const qs = await db.collection('users').where('email', "==", email).limit(1).get();
  const user = qs.docs;
  return user[0].data();
}

/**
 * Adds a colony uuid to a users ownedColonies
 *
 * @param username - user's username
 * @param colonyId - uuid of colony to add to profile
 */
const addColonyToUser = async (uid, colonyId) => {
  const user = db.collection('users').doc(uid);
  user.update({
    ownedColonies: admin.firestore.FieldValue.arrayUnion(colonyId),
  });
};

/**
 * Adds a colony uuid to a users sharedColonies
 *
 * @param username - user's username
 * @param colonyId - uuid of colony to add to profile
 */
const addSharedColonyToUser = async (uid, colonyId, accessRights) => {
  const user = db.collection('users').doc(uid);
  const entry = { colonyId, accessRights };
  const inversePermission = !accessRights;
  user.update({
    sharedColonies: admin.firestore.FieldValue.arrayRemove({ colonyId, accessRights: inversePermission }),
  });

  user.update({
    sharedColonies: admin.firestore.FieldValue.arrayUnion(entry),
  });
};

const deleteColony = async (colonyId) => {
  const colony = db.collection('colonies').doc(colonyId);
  const animals = colony.collection('animals');
  await deleteAnimals(animals);
  colony.delete();
  return;
};

const deleteAnimals = async (query) => {
  query.get()
    .then((snapshot) => {
      if (snapshot.size === 0) {
        return 0;
      }

      var batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      return batch.commit();
    }).then((numDeleted) => {
      if (numDeleted === 0) {
        return;
      }

      process.nextTick(() => {
        deleteAnimals(query);
      });
    })
    .catch(() => {
    });
}

/**
 * Delete an animal from a colony in the database
 *
 * @param colonyId - colony to delete from
 * @param animalId - animal to delete
 */
const deleteAnimal = async (colonyId, animalId) => {

  const colony = db.collection('colonies').doc(colonyId);
  const animalToDelete = colony.collection('animals').doc(animalId);

  animalToDelete.delete()
    .then(() => {
      colony.update({
        size: admin.firestore.FieldValue.increment(-1),
      });
  }).catch((error) => console.log(error));
}

const editAnimal = async (colonyId, animal) => {

  const colonyRef = db.collection('colonies').doc(colonyId);
  const animalRef = colonyRef.collection('animals').doc(animal.animalUUID);

  await animalRef.set(animal);

  return animal;
}

/**
 * Adds initial colony meta data to the database with a generated
 * uuid for the colony. This uuid is added to the user's profile.
 *
 * @param username - username of person creating this colony
 * @param colonyInfo - Initial colony meta data
 *
 * @return colony.id - uuid of new colony
 */
const addColony = async (uid, colonyInfo) => {
  const colony = db.collection('colonies').doc();
  addColonyToUser(uid, colony.id);
  colonyInfo.colonyId = colony.id;
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
  await colony.update({
    size: admin.firestore.FieldValue.increment(1),
  });
  const animal = colony.collection('animals').doc();
  animalInfo.animalUUID = animal.id;
  await animal.set(animalInfo);
  return animal.id;
};

const storeImageLink = async (colonyId, animalId, url) => {
  const colony = db.collection('colonies').doc(colonyId);
  const animal = colony.collection('animals').doc(animalId);
  animal.update({
    imageLinks: admin.firestore.FieldValue.arrayUnion(url),
  });
  return { animalId, url };
};

const storeNote = async (colonyId, animalId, note) => {
  const colony = db.collection('colonies').doc(colonyId);
  const animal = colony.collection('animals').doc(animalId);
  animal.update({
    notes: admin.firestore.FieldValue.arrayUnion(note),
  });
  return { animalId, note };
};

const getColonies = async (list) => {
  const coloniesRef = db.collection('colonies');
  const colonies = [];

  for (let i = 0; i < list.length; i++) {
    const colony = await coloniesRef.doc(list[i]).get();
    if (colony.exists) {
      colonies.push(colony.data());
    }
  }

  return colonies;
};

const getSharedColonies = async (list) => {
  const coloniesRef = db.collection('colonies');
  const colonies = [];

  for (let i = 0; i < list.length; i++) {
    const colony = await coloniesRef.doc(list[i].colonyId).get();
    if (colony.exists) {
      const obj = colony.data();
      obj.accessRights = list[i].accessRights;
      colonies.push(obj);
    }
  }
  return colonies;
};

const getAnimals = async (colonyId, pageSize, pageNum) => {
  const colonyRef = db.collection('colonies').doc(colonyId);
  const animalsRef = colonyRef.collection('animals').limit(pageSize).offset(pageSize * pageNum);

  const snapshot = await animalsRef.get();
  const results = snapshot.docs.map(doc => doc.data());
  const animals = { animals: results, colonyId };
  return animals;
};

module.exports = {
  createUser, getUserByUid, getUserByEmail, addColony, addAnimal, addColonyToUser, getColonies, getAnimals, addSharedColonyToUser, deleteColony, deleteAnimal, editAnimal, getSharedColonies, storeImageLink, storeNote
};
