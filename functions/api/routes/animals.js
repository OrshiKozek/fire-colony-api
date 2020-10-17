const { Router } = require('express');
const animalController = require('../controllers/animals');
const authentication = require('../middleware/auth');

const router = Router();

router.post('/', authentication, animalController.getAnimals);

router.post('/search', authentication, animalController.searchAnimals);

router.post('/delete', authentication, animalController.deleteAnimal);

router.post('/edit', authentication, animalController.editAnimal);

router.post('/add', authentication, animalController.addAnimal);

router.post('/storeImageLink', authentication, animalController.storeImageLink);

router.post('/storeNote', authentication, animalController.storeNote);

module.exports = router;
