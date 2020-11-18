const admin = require('firebase-admin');
const { pick } = require('lodash');


const serviceAccount = require('../../animal-colony-project-firebase-adminsdk-5815z-bdfc4220e8.json');

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

const addNewToTag = async (name, mouse) => {
  console.log(`adding tag: name: ${name},mouse: ${mouse}`);
  const newTag = db.collection('tags').doc(name);
  newTag.get()
  .then(function(doc1) {
    if (doc1.exists) {
      console.log("currmouse:", mouse);
      console.log("Document data1:", doc1.data());
      newTag.update({
        list: admin.firestore.FieldValue.arrayUnion(mouse),
      });

      console.log("Document data2:", doc1.data());
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
      newTag.set({list: [mouse]});
      console.log("Created such document");
    }
  }).catch(function(error) {
    console.log("Error getting document:", error);
  });

  return newTag.id;
}

const createNewTag = async (name) => {
  console.log(`adding tag: name: ${name}`);
  const newTag = db.collection('tags').doc(name);
  newTag.get()
  .then(function(doc1) {
    if (doc1.exists) {
      console.log(`${doc1.id} already exists`);

    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
      newTag.set({list: []});
      console.log("Created such document");
    }
  }).catch(function(error) {
    console.log("Error getting document:", error);
  });

  return newTag.id;
}

const getTag = async (tagName) => {
  const tagData = await db.collection('tags').doc(tagName).get();
  return tagData.data();
}

const getTags = async () => {
  const tagReference = db.collection('tags');
  const snapshot = await tagReference.get();
  const results = snapshot.docs.map(doc => doc.id);
  const tagList = {tagList: results};
  return tagList;
}

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
  animalInfo.imageLinks = [];
  animalInfo.notes = [];
  animalInfo.tags = [];
  animalInfo.events = [];
  await animal.set(animalInfo);
  // return animal.id;
  console.log(animalInfo);
  return animalInfo;
};

const storeImageLink = async (colonyId, animalId, url, timestamp, date, note) => {
  const colony = db.collection('colonies').doc(colonyId);
  const animal = colony.collection('animals').doc(animalId);

  var imageArray = {};
  imageArray.date = date;
  imageArray.note = note;
  imageArray.timestamp = timestamp;
  imageArray.url = url;

  animal.update({
    imageLinks: admin.firestore.FieldValue.arrayUnion(imageArray),
  });

  return { animalId, imageArray };
};

const storeNote = async (colonyId, animalId, note) => {
  const colony = db.collection('colonies').doc(colonyId);
  const animal = colony.collection('animals').doc(animalId);
  animal.update({
    notes: admin.firestore.FieldValue.arrayUnion(note),
  });
  return { animalId, note };
};

const storeTag = async (colonyId, animalId, tag) => {
  const colony = db.collection('colonies').doc(colonyId);
  const animal = colony.collection('animals').doc(animalId);
  animal.update({
    tags: admin.firestore.FieldValue.arrayUnion(tag),
  });
  return { animalId, tag };
};

const storeEvent = async (colonyId, animalId, eventInfo) => {
  const colony = db.collection('colonies').doc(colonyId);
  const animal = colony.collection('animals').doc(animalId);
  animal.update({
    events: admin.firestore.FieldValue.arrayUnion(eventInfo),
  });

  const eventRef = db.collection('events').doc();
  var users = await getUsers(colonyId);
  eventRef.set({
      event: eventInfo.event,
      timestamp: eventInfo.timestamp,
      users: users,
  });

  return { animalId, eventInfo };
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

const getUsers = async (colonyId) => {
  const usersRef = db.collection('users');
  const querySnapshot = await usersRef.get();
  var users = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const numberOfKeys = Object.keys(data).length;
      if(numberOfKeys > 0){
        if(data.ownedColonies.indexOf(colonyId) != -1 || data.sharedColonies.indexOf(colonyId) != -1) {
          const currUser = data.email;
          users.push(currUser);
        }
      }
    })
  }
  console.log("Users: " + users);
  return users;
}

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

const searchAnimals = async (colonyId, searchCriteria) => {
  const { dobDay, dobMonth, dobYear, dodDay, dodMonth, dodYear, fatherId, gender, gene1, gene2, gene3, litter, motherId, mouseId } = searchCriteria;
  const colonyRef = db.collection('colonies').doc(colonyId);
  var animalsRef = colonyRef.collection('animals');

  if (dobDay) {
    animalsRef = animalsRef.where("dobDay", "==", dobDay);
  }

  if (dobMonth) {
    animalsRef = animalsRef.where("dobMonth", "==", dobMonth);
  }

  if (dobYear) {
    animalsRef = animalsRef.where("dobYear", "==", dobYear);
  }

  if (dodDay) {
    animalsRef = animalsRef.where("dodDay", "==", dodDay);
  }

  if (dodMonth) {
    animalsRef = animalsRef.where("dodMonth", "==", dodMonth);
  }

  if (dodYear) {
    animalsRef = animalsRef.where("dodYear", "==", dodYear);
  }

  if (fatherId) {
    animalsRef = animalsRef.where("fatherId", "==", fatherId);
  }

  if (gender) {
    animalsRef = animalsRef.where("gender", "==", gender);
  }

  if (gene1) {
    animalsRef = animalsRef.where("gene1", "==", gene1);
  }

  if (gene2) {
    animalsRef = animalsRef.where("gene2", "==", gene2);
  }

  if (gene3) {
    animalsRef = animalsRef.where("gene3", "==", gene3);
  }

  if (litter) {
    animalsRef = animalsRef.where("litter", "==", litter);
  }

  if (motherId) {
    animalsRef = animalsRef.where("motherId", "==", motherId);
  }

  if (mouseId) {
    animalsRef = animalsRef.where("mouseId", "==", mouseId);
  }

  const snapshot = await animalsRef.get();
  const results = snapshot.docs.map(doc => doc.data());
  const searchResults = { animals: results, colonyId };
  return searchResults;
};

module.exports = {
  createUser, getUserByUid, getUserByEmail, addColony, addAnimal, addColonyToUser, getColonies, getAnimals, addSharedColonyToUser, deleteColony, deleteAnimal, editAnimal, getSharedColonies, storeImageLink, storeNote, storeEvent, getUsers, storeTag, addNewToTag, createNewTag, getTag, getTags, searchAnimals
};
