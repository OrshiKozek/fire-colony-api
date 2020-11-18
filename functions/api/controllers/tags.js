const dataService = require('../services/database');


const addToTag = async (req, res) => {
  const { body: { tagName, mouse } } = req;

  await dataService.addNewToTag(tagName, mouse);
  
  res.status(200).json({name:tagName, list: mouse});
  
}

const createTag = async (req, res) => {
  const { body: { tagName } } = req;

  await dataService.createNewTag(tagName);
  
  res.status(200).json({name:tagName});
  
}

const getOneTag = async (req, res) => {
  const { body : { tagName } } = req;

  await dataService.getTag(tagName)
    .then((tagResult) => {
      res.status(200).json(animals);
    })
    .catch(() => res.sendStatus(404));
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