const dataService = require('../services/database');
const animalController = require('../controllers/animals');

/**
 * Parses the incoming csv string of colony data, creates a new colony in
 * the database, and adds data from the string to the colony.
 *
 * @param req
 * @param res
 * @param next
 */
const createColony = async (req, res, next) => {
  const { user: { email }, body: { payload, name } } = req;

  /* Create initial colony meta data and add to db */
  const colonyMeta = { colonyName: name, size: 0 };
  const colonyId = await dataService.addColony(email, colonyMeta);

  /* Parse the csv payload */
  const lines = payload.split('\n');
  const headers = lines[0].split(',');

  let animalCount = 0;
  const animalPromises = [];

  for (let i = 1; i < lines.length; i++) {
    if (/\S/.test(lines[i])) {
      const animal = animalController.createAnimal(headers, lines[i]).then((animal) => dataService.addAnimal(colonyId, animal))
        .catch((err) => {
          next(Error(`Could not create animal: ${err.toString()}`));
        });
      animalPromises.push(animal);
      animalCount++;
    }
  }

  await Promise.all(animalPromises);

  colonyMeta.colonyId = colonyId;
  colonyMeta.size = animalCount;

  res.status(200).json(colonyMeta);
};

const deleteColony = async (req, res) => {
  const { body: { colonyId } } = req;

  await dataService.deleteColony(colonyId)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => res.sendStatus(404));
};

const shareColony = async (req, res) => {
  const { body: { email, colonyId, accessRights } } = req;

  await dataService.addSharedColonyToUser(email, colonyId, accessRights)
    .then((uuid) => {
      res.status(200).json(uuid);
    })
    .catch(() => res.sendStatus(404));
};

module.exports = { createColony, shareColony, deleteColony };
