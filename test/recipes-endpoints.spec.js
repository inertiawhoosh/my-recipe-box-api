const knex = require('knex')
const fixtures = require('./recipes-fixtures')
const app = require('../src/app')

describe('Recipes Endpoints', () => {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => db('recipes').truncate())

  afterEach('cleanup', () => db('recipes').truncate())


  describe('GET /api/recipes', () => {
    context(`Given no recipes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/recipes')
          .expect(200, [])
      })
    })

    context('Given there are recipes in the database', () => {
      const testRecipes = fixtures.makeRecipesArray()

      beforeEach('insert recipes', () => {
        return db
          .into('recipes')
          .insert(testRecipes)
      })

      it('gets the recipes from the store', () => {
        return supertest(app)
          .get('/api/recipes')
          .expect(200, testRecipes)
      })
    })

    context(`Given an XSS attack recipe`, () => {
      const { maliciousRecipe, expectedRecipe } = fixtures.makeMaliciousRecipe()

      beforeEach('insert malicious recipe', () => {
        return db
          .into('recipes')
          .insert([maliciousRecipe])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/recipes`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedRecipe.name)
           expect(res.body.url).to.eql(expectedRecipe.url)
           expect(res.body.ingredients).to.eql(expectedRecipe.ingredients)
           expect(res.body.instructions).to.eql(expectedRecipe.instructions)
           expect(res.body.notes).to.eql(expectedRecipe.notes)
           expect(res.body.cooking_speed).to.eql(expectedRecipe.cooking_speed)
          })
      })
    })
  })

  describe('GET /api/recipes/:id', () => {
    context(`Given no recipes`, () => {
      it(`responds 404 whe recipe doesn't exist`, () => {
        return supertest(app)
          .get(`/api/recipes/123`)
          .expect(404, {
            error: { message: `Recipe Not Found` }
          })
      })
    })

    context('Given there are recipes in the database', () => {
      const testRecipes = fixtures.makeRecipesArray()

      beforeEach('insert recipes', () => {
        return db
          .into('recipes')
          .insert(testRecipes)
      })

      it('responds with 200 and the specified recipe', () => {
        const recipeId = 2
        const expectedRecipe = testRecipes[recipeId - 1]
        return supertest(app)
          .get(`/api/recipes/${recipeId}`)
          .expect(200, expectedRecipe)
      })
    })

    context(`Given an XSS attack recipe`, () => {
      const { maliciousRecipe, expectedRecipe } = fixtures.makeMaliciousRecipe()

      beforeEach('insert malicious recipe', () => {
        return db
          .into('recipes')
          .insert([maliciousRecipe])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/recipes/${maliciousRecipe.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedRecipe.name)
         expect(res.body.url).to.eql(expectedRecipe.url)
         expect(res.body.ingredients).to.eql(expectedRecipe.ingredients)
         expect(res.body.instructions).to.eql(expectedRecipe.instructions)
         expect(res.body.notes).to.eql(expectedRecipe.notes)
         expect(res.body.cooking_speed).to.eql(expectedRecipe.cooking_speed)
          })
      })
    })
  })

  describe('DELETE /api/recipes/:id', () => {
    context(`Given no recipes`, () => {
      it(`responds 404 whe recipe doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/recipes/123`)
          .expect(404, {
            error: { message: `Recipe Not Found` }
          })
      })
    })

    context('Given there are recipes in the database', () => {
      const testRecipes = fixtures.makeRecipesArray()

      beforeEach('insert recipes', () => {
        return db
          .into('recipes')
          .insert(testRecipes)
      })

      it('removes the recipe by ID from the store', () => {
        const idToRemove = 2
        const expectedRecipes = testRecipes.filter(bm => bm.id !== idToRemove)
        return supertest(app)
          .delete(`/api/recipes/${idToRemove}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/recipes`)
              .expect(expectedRecipes)
          )
      })
    })
  })

  describe('POST /api/recipes', () => {
    ['title', 'url', 'rating'].forEach(field => {
      const newRecipe = {
        name: 'test-title',
        url: 'https://test.com',
        ingredients: 'test ingredients',
        instructions: 'test instructions',
        notes: 'test notes',
        cooking_speed: 'quick',
      }

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newRecipe[field]

        return supertest(app)
          .post(`/api/recipes`)
          .send(newRecipe)
          .expect(400, {
            error: { message: `'${field}' is required` }
          })
      })
    })


    it(`responds with 400 invalid 'url' if not a valid URL`, () => {
      const newRecipeInvalidUrl = {
        name: 'test-title',
        url: 'https://invalid-url',
        ingredients: 'test ingredients',
        instructions: 'test instructions',
        notes: 'test notes',
        cooking_speed: 'quick',
      }
      return supertest(app)
        .post(`/api/recipes`)
        .send(newRecipeInvalidUrl)
        .expect(400, {
          error: { message: `'url' must be a valid URL` }
        })
    })

    it('adds a new recipe to the store', () => {
      const newRecipe = {
        name: 'test-title',
        url: 'https://test.com',
        ingredients: 'test ingredients',
        instructions: 'test instructions',
        notes: 'test notes',
        cooking_speed: 'quick',
      }
      return supertest(app)
        .post(`/api/recipes`)
        .send(newRecipe)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newRecipe.title)
          expect(res.body.url).to.eql(newRecipe.url)
          expect(res.body.description).to.eql(newRecipe.description)
          expect(res.body.rating).to.eql(newRecipe.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/recipes/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/recipes/${res.body.id}`)
            .expect(res.body)
        )
    })

    it('removes XSS attack content from response', () => {
      const { maliciousRecipe, expectedRecipe } = fixtures.makeMaliciousRecipe()
      return supertest(app)
        .post(`/api/recipes`)
        .send(maliciousRecipe)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedRecipe.title)
          expect(res.body.description).to.eql(expectedRecipe.description)
        })
    })
  })

  describe(`PATCH /api/recipes/:recipe_id`, () => {
    context(`Given no recipes`, () => {
      it(`responds with 404`, () => {
        const recipeId = 123456
        return supertest(app)
          .patch(`/api/recipes/${recipeId}`)
          .expect(404, { error: { message: `Recipe Not Found` } })
      })
    })

    context('Given there are recipes in the database', () => {
      const testRecipes = fixtures.makeRecipesArray()

      beforeEach('insert recipes', () => {
        return db
          .into('recipes')
          .insert(testRecipes)
      })

      it('responds with 204 and updates the recipe', () => {
        const idToUpdate = 2
        const updateRecipe = {
           name: 'updated-title',
          url: 'https://updatedtest.com',
          ingredients: 'updated ingredients',
          instructions: 'updated instructions',
          notes: 'updated notes',
          cooking_speed: 'quick',
        }
        const expectedArticle = {
          ...testRecipes[idToUpdate - 1],
          ...updateRecipe
        }
        return supertest(app)
          .patch(`/api/recipes/${idToUpdate}`)
          .send(updateRecipe)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/recipes/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedArticle)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/recipes/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain everything`
            }
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateRecipe = {
          name: 'updated recipe name',
        }
        const expectedRecipe = {
          ...testRecipes[idToUpdate - 1],
          ...updateRecipe
        }

        return supertest(app)
          .patch(`/api/recipes/${idToUpdate}`)
          .send({
            ...updateRecipe,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/recipes/${idToUpdate}`)
              .expect(expectedRecipe)
          )
      })

     

      it(`responds with 400 invalid 'url' if not a valid URL`, () => {
        const idToUpdate = 2
        const updateInvalidUrl = {
          url: 'htp://invalid-url',
        }
        return supertest(app)
          .patch(`/api/recipes/${idToUpdate}`)
          .send(updateInvalidUrl)
          .expect(400, {
            error: {
              message: `'url' must be a valid URL`
            }
          })
      })
    })
  })
})

