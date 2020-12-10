const dataService = require('../services/database');


const addToTag = async (req, res) => {
  const { body: { tagName, mouse } } = req;

  await dataService.addNewToTag(tagName, mouse)
  .then(({name:tagName, list: mouse}) => {
    res.status(200).json({name:tagName, list: mouse});
  })
  .catch((error) => {
    res.sendStatus(404);
    console.log(error)}
  );
}

const createTag = async (req, res) => {
  const { body: { tagName } } = req;

  await dataService.createNewTag(tagName)
  .then(({name:tagName}) => {
    res.status(200).json({name:tagName});
  })
  .catch((error) => {
    res.sendStatus(404);
    console.log(error)}
  );
}

const getOneTag = async (req, res) => {
  const { body : { tagName } } = req;

  await dataService.getTag(tagName)
    .then((tagResult) => {
      res.status(200).json(tagResult);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );
}

const getAllTags = async (req, res) => {
  await dataService.getTags()
    .then((docs) => {
      res.status(200).json(docs);
    })
    .catch((error) => {
      res.sendStatus(404);
      console.log(error)}
    );
}

module.exports = { addToTag, createTag, getOneTag, getAllTags };