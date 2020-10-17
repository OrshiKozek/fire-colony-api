const dataService = require('../services/database');

/**
 * Get animals of a colony starting at a certain page with a certain page size
 *
 * @param req
 * @param res
 */
const getAnimals = async (req, res) => {
  const { body: { colonyId, rowsPerPage, page } } = req;

  await dataService.getAnimals(colonyId, rowsPerPage, page)
    .then((animals) => {
      res.status(200).json(animals);
    })
    .catch(() => res.sendStatus(404));
};

const deleteAnimal = async (req, res) => {
  const { body: { colonyId, animalId } } = req;
  await dataService.deleteAnimal(colonyId, animalId)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => res.sendStatus(404));
}

const editAnimal = async (req, res) => {
  const { body: { animal, colonyId } } = req;
  await dataService.editAnimal(colonyId, animal)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => res.sendStatus(404));
}

/**
 * Parses a single line of csv data into an animal json object
 *
 * @param headers - headers to use as identifiers for the object
 * @param line    - line to parse into json object
 *
 * @return animal - json representation of the animal
 */
const createAnimal = async (headers, line) => {
  const animal = {};
  const lineSplit = line.split(',');

  for (let i = 0; i < headers.length; i++) {
    animal[headers[i].trim()] = lineSplit[i];
  }

  animal.imageLinks = [];
  animal.notes = [];
  animal.events = [];

  return animal;
};

const storeImageLink = async (req, res) => {
  const { body: { colonyId, animalId, url } } = req;
  await dataService.storeImageLink(colonyId, animalId, url)
    .then((link) => {
      res.status(200).json(link);
    })
    .catch(() => res.sendStatus(500));
}

const storeNote = async (req, res) => {
  const { body: { colonyId, animalId, note } } = req;
  await dataService.storeNote(colonyId, animalId, note)
    .then((note) => {
      res.status(200).json(note);
    })
    .catch(() => res.sendStatus(500));
}

const storeEvent = async(req, res) => {
  const {body: {colonyId, animalId, eventInfo}} = req;
   await dataService.storeEvent(colonyId, animalId, eventInfo)
    .then((event) => {
      res.status(200).json(event);
    })
    .catch(() => res.sendStatus(500));

}
module.exports = { getAnimals, deleteAnimal, editAnimal, storeImageLink, createAnimal, storeNote, storeEvent };
