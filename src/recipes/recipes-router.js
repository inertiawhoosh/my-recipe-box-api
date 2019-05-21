const path = require('path')
const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const RecipesService = require('./recipes-service')
const { getRecipeValidationError } = require('./recipe-validator')

const recipesRouter = express.Router()
const bodyParser = express.json()

const serializeRecipe = recipe => ({
  id: recipe.id,
  name: xss(recipe.name),
  url: xss(recipe.url),
  ingredients: xss(recipe.ingredients),
  instructions: xss(recipe.instructions),
  notes: xss(recipe.notes),
  cooking_speed: recipe.cooking_speed,
})

recipesRouter
  .route('/recipes')
  .get((req, res, next) => {
    RecipesService.getAllRecipes(req.app.get('db'))
      .then(recipes => {
        res.json(recipes.map(serializeRecipe))
      })
      .catch(next)
  })

  .post(bodyParser, (req, res, next) => {
    const { name, url, ingredients, instructions, notes, cooking_speed } = req.body
    const newRecipe = { name, url, ingredients, instructions, notes, cooking_speed }

    for (const field of ['name', 'url', 'ingredients', 'instructions', 'notes', 'cooking_speed']) {
      if (!newRecipe[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        })
      }
    }

    const error = getRecipeValidationError(newRecipe)

    if (error) return res.status(400).send(error)

    RecipesService.insertRecipe(
      req.app.get('db'),
      newRecipe
    )
      .then(recipe => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${recipe.id}`))
          .json(serializeRecipe(recipe))
      })
      .catch(next)
  })


recipesRouter
  .route('/:recipe_id')

  .all((req, res, next) => {
    const { recipe_id } = req.params
    RecipesService.getById(req.app.get('db'), recipe_id)
      .then(recipe => {
        if (!recipe) {
          logger.error(`Recipe with id ${recipe_id} not found.`)
          return res.status(404).json({
            error: { message: `Recipe Not Found` }
          })
        }

        res.recipe = recipe
        next()
      })
      .catch(next)

  })

  .get((req, res) => {
    res.json(serializeRecipe(res.recipe))
  })

  .delete((req, res, next) => {
    const { recipe_id } = req.params
    RecipesService.deleteRecipe(
      req.app.get('db'),
      recipe_id
    )
      .then(numRowsAffected => {
        logger.info(`Recipe with id ${recipe_id} deleted.`)
        res.status(204).end()
      })
      .catch(next)
  })

  .patch(bodyParser, (req, res, next) => {
    const { name, url, ingredients, instructions, notes, cooking_speed } = req.body
    const recipeToUpdate = { name, url, ingredients, instructions, notes, cooking_speed }

    const numberOfValues = Object.values(recipeToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      logger.error(`Invalid update without required fields`)
      return res.status(400).json({
        error: {
          message: `Request body must content either 'name', 'url', ingredients, instructions, notes, cooking_speed`
        }
      })
    }

    const error = getRecipeValidationError(recipeToUpdate)

    if (error) return res.status(400).send(error)

    RecipesService.updateRecipe(
      req.app.get('db'),
      req.params.recipe_id,
      recipeToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = recipesRouter