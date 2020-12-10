const dataService = require('../services/database');
const animalController = require('../controllers/animals');

const checkGenes = async (name, value, mother, father, errorsList) => {
      var valid = true;

      const fatherGene = father[name];
      const motherGene = mother[name];

      if (fatherGene && motherGene) {
        if (value === '+/-') {
            valid = fatherGene !== motherGene || fatherGene === '+/-';
        }
        else if (value === '-/-') {
            valid = motherGene.includes('-') && fatherGene.includes('-');
        }
        else if (value === '+/+') {
            valid = motherGene.includes('+') && fatherGene.includes('+');
        }

        if (!valid) {
          errorsList.push(`Check ${name}: ${value} invalid for father ${name} of ${fatherGene} and mother ${name} of ${motherGene}`);
        }
      }
}

  const checkAllGenes = (animal, mother, father, errorsList) => {
    if (animal.gene1) {
      checkGenes('gene1', animal.gene1, mother, father, errorsList);
    }
    if (animal.gene2) {
      checkGenes('gene2', animal.gene2, mother, father, errorsList);
    }
    if (animal.gene3) {
      checkGenes('gene3', animal.gene3, mother, father, errorsList);
    }
  }

const checkForErrors = async (colonyId, animalCount) => {
  var errorFlag = false;

  const numRegex = RegExp('^\\d*$');

  const {animals} = await dataService.getAnimals(colonyId, animalCount, 0)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );

  let animalTable = {};
  for (var index = 0; index < animals.length; ++index) {
    animalTable[animals[index].mouseId] = animals[index];
  }

  for (var index = 0; index < animals.length; ++index) {
    var errorsList = [];

    //check if gender is m or f, if not set error and set to empty
    if (animals[index].gender != 'M' && animals[index].gender != 'F') {
      animals[index].gender = "";
      errorsList.push("Gender should be set to M or F");
    }

    //check if mouse id is numeric
    if (!numRegex.test(animals[index].mouseId)) {
      errorsList.push("animalId should be numeric");
    }

    //check if father and mother id are numeric and found in colony
    if (!numRegex.test(animals[index].fatherId)) {
      errorsList.push("fatherId should be numeric");
    }
    else {
      if (!animalTable[animals[index].fatherId] || animalTable[animals[index].fatherId].gender !== 'M') {
        errorsList.push(`Check fatherId; male mouse with ID ${animals[index].fatherId} not found in colony`);
      }
    }

    if (!numRegex.test(animals[index].motherId)) {
      errorsList.push("motherId should be numeric");
    }
    else {
      if (!animalTable[animals[index].motherId] || animalTable[animals[index].motherId].gender !== 'F') {
        errorsList.push(`Check motherId; female mouse with ID ${animals[index].motherId} not found in colony`);
      }
    }

    //-/+ change to +/- for consistency
    var gene1 = animals[index].gene1;
    var gene2 = animals[index].gene2;
    var gene3 = animals[index].gene3;
    if (gene1 === '-/+') {
      animals[index].gene1 = '+/-';
      gene1 = '+/-';
    }
    if (gene2 === '-/+') {
      animals[index].gene2 = '+/-';
      gene2 = '+/-';
    }
    if (gene3 === '-/+') {
      animals[index].gene3 = '+/-';
      gene3 = '+/-';
    }

    //genes: are they all +/+, +/-, or -/-?
    if (gene1 !== '+/-' && gene1 !== '+/+' && gene1 !== '-/-') {
      errorsList.push('Check gene1: should be set to +/+, +/-, or -/-');
    }
    if (gene2 !== '+/-' && gene2 !== '+/+' && gene2 !== '-/-') {
      errorsList.push('Check gene2: should be set to +/+, +/-, or -/-');
    }
    if (gene3 !== '+/-' && gene3 !== '+/+' && gene3 !== '-/-') {
      errorsList.push('Check gene3: should be set to +/+, +/-, or -/-');
    }

    //check genotypes
    if (animalTable[animals[index].motherId] && animalTable[animals[index].fatherId]) {
      checkAllGenes(animals[index], animalTable[animals[index].motherId], animalTable[animals[index].fatherId], errorsList);
    }

    //set errors to animal
    if (errorsList.length > 0) {
      errorFlag = true;
      animals[index].fileErrors = errorsList;
      dataService.editAnimal(colonyId, animals[index]);
    }
  }

  return errorFlag;
}

/**
 * Parses the incoming csv string of colony data, creates a new colony in
 * the database, and adds data from the string to the colony.
 *
 * @param req
 * @param res
 * @param next
 */
const createColony = async (req, res, next) => {
  const { user: { uid }, body: { payload, name, geneNames } } = req;

  /* Create initial colony meta data and add to db */
  const colonyMeta = { colonyName: name, size: 0, geneNames };
  const colonyId = await dataService.addColony(uid, colonyMeta)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );

  /* Parse the csv payload */
  const lines = payload.split('\r\n');
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

  await Promise.all(animalPromises)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );

  const fileErrorsFound = await checkForErrors(colonyId, animalCount)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );

  colonyMeta.colonyId = colonyId;
  colonyMeta.size = animalCount;
  colonyMeta.fileErrorsFound = fileErrorsFound;

  res.status(200).json(colonyMeta);
};

const deleteColony = async (req, res) => {
  const { body: { colonyId } } = req;

  await dataService.deleteColony(colonyId)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
    res.sendStatus(404);
    console.log(error)}
    );
  };

const shareColony = async (req, res) => {
  const { body: { email, colonyId, accessRights } } = req;

  const userData = await dataService.getUserByEmail(email)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );

  await dataService.addSharedColonyToUser(userData.uid, colonyId, accessRights)
    .then((uuid) => {
      res.status(200).json(uuid);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
      );
};

module.exports = { createColony, shareColony, deleteColony };
