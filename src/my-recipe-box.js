require('dotenv').config()
const knex = require('knex')
const RecipesService = require('./recipes-service')

const knexInstance = knex({
  client: 'pg',
  connection: process.env.DB_URL,
})

console.log(RecipesService.getAllRecipes())
