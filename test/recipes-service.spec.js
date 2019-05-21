const RecipesService = require ('../src/recipes-service')
const knex = require('knex')

describe(`Recipes service object`, function() {
	let db
	let testRecipes = [
	{
		id: 1,
		title: 'Test Title',
		url: 'test url',
		ingredients: 'ingredients',
		instructions: 'instructions',
		notes: 'notes',
		cooking_speed: 'quick'
	}]

	before(() => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DB_URL,
		})
	})

	after(() => db.destroy())

	before(() => db('recipes').truncate())

	afterEach(() => db('recipes').truncate())

  context(`given 'recipes' has data`, ()=> {
  	before(() => {
  		return db
  			.into('recipes')
  			.insert(testRecipes)
  	})

  	it(`getAllRecipes(0 resolves all recipes from recipes table`, () => {
  		 // test that RecipesService.getAllRecipes gets data from table
  		 return RecipesService.getAllRecipes(db)
  		 .then(actual => {
  		 	expect(actual).to.eql(testRecipes)
  		 })
  	})
  })

  context(`Given 'recipes' has no data`, () => {
  	it(`getAllRecipes() resolves an empty array`, () => {
  		return RecipesService.getAllRecipes(db)
  			.then(actual => {
  				expect(actual).to.eql([])
  			})
  	})

    it(`deleteRecipe() removes a recipe`, () => {
      const recipeId = 1
      return RecipesService.deleteRecipe(db, recipe)
      .then(() => RecipesService.getAllRecipes(db))
      .then(allRecipes => {
        const expected = testRecipes.filter(recipe => recipe.id !== recipeId)
        expect(allRecipes).to.eql(expected)
      })
    })

    it(`updateRecipe() updates an Recipe from the 'recipes' table`, () => {
     const idOfRecipeToUpdate = 3
     const newRecipeData = {
       title: 'update  Title',
        url: 'updated  url',
        ingredients: 'updated ingredients',
        instructions: 'updated instructions',
        notes: 'updated notes',
        cooking_speed: 'updated quick'
     }
     return RecipesService.updateRecipe(db, idOfRecipeToUpdate, newRecipeData)
       .then(() => RecipesService.getById(db, idOfRecipeToUpdate))
       .then(recipe => {
         expect(recipe).to.eql({
           id: idOfRecipeToUpdate,
           ...newRecipeData,
         })
       })
     })
  	it(`insertRecipe() inserts a new recipe and resolves with an 'id'`, () => {
  		const newRecipe = {
    		title: 'Test new Title',
    		url: 'test new url',
    		ingredients: 'new ingredients',
    		instructions: 'new instructions',
    		notes: 'new notes',
    		cooking_speed: 'new quick'
  		}
  		return RecipesService.insertRecipe(db, newRecipe)
        .then(actual => {
        expect(actual).to.eql({
          id: 1, 
          title: newRecipe.title,
          url: newRecipe.url,
          ingredients: newRecipe.ingredients,
          instructions: newRecipe.instructions,
          notes: newRecipe.notes,
          cooking_speed: newRecipe.cooking_speed,
        })
      })
  	})
  })
})