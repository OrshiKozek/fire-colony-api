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
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
};

const deleteAnimal = async (req, res) => {
  const { body: { colonyId, animalId } } = req;
  await dataService.deleteAnimal(colonyId, animalId)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
}

const editAnimal = async (req, res) => {
  const { body: { animal, colonyId } } = req;

  await dataService.editAnimal(colonyId, animal)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
}

const addAnimal = async (req, res) => {
  const { body: { animal, colonyId } } = req;

  await dataService.addAnimal(colonyId, animal)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
}

const searchAnimals = async (req, res) => {
  const { body: { colonyId, searchCriteria, tags } } = req;

  await dataService.searchAnimals(colonyId, searchCriteria, tags)
    .then((searchResults) => {
      res.status(200).json(searchResults);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
};

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
//Might have to update headers length if we're going to be
//using csv files that already include tags...
//or are tags going to be an interface feature only
//idk if we're trying to go csv free...
  for (let i = 0; i < headers.length; i++) {
    animal[headers[i].trim()] = lineSplit[i];
  }

  animal.imageLinks = [];
  animal.notes = [];
  animal.tags = [];
  animal.events = [];
  return animal;
};

const storeImageLink = async (req, res) => {
  const { body: { colonyId, animalId, url, timestamp, date, note, name } } = req;
  
  await dataService.storeImageLink(colonyId, animalId, url, timestamp, date, note, name)
    .then((link) => {
      res.status(200).json(link);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );
}

const deleteImageLink = async (req, res) => {
  const { body: { colonyId, animalId, imageObject } } = req;

  await dataService.deleteImageLink(colonyId, animalId, imageObject)
  .then((result) => {
    res.status(200).json(result);
  })
  .catch((error) => {
    res.sendStatus(404);
    console.log(error)}
    );
}

const storeNote = async (req, res) => {
  const { body: { colonyId, animalId, note } } = req;
  await dataService.storeNote(colonyId, animalId, note)
    .then((note) => {
      res.status(200).json(note);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
}

const storeTags = async (req, res) => {
  const { body: { colonyId, animalId, tag } } = req;
  await dataService.storeTag(colonyId, animalId, tag)
    .then((tag) => {
      res.status(200).json(tag);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
}

const storeEvent = async(req, res) => {
  const {body: {colonyId, animalId, eventInfo}} = req;
   await dataService.storeEvent(colonyId, animalId, eventInfo)
    .then((event) => {
      res.status(200).json(event);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );

}

module.exports = { getAnimals, deleteAnimal, editAnimal, addAnimal, storeImageLink, deleteImageLink, createAnimal, storeNote, storeTags, storeEvent, searchAnimals };
