function makeRecipesArray() {
  return [
    {
      id: 1,
      name: 'Test Title',
      url: 'test url',
      ingredients: 'ingredients',
      instructions: 'instructions',
      notes: 'notes',
      cooking_speed: 'quick'
    },
  ]
}

function makeMaliciousRecipe() {
  const maliciousRecipe = {
    id: 1,
    name: 'Malicious Title',
    url: 'bad.url',
    ingredients: 'malicious ingredients',
    instructions: 'malicious instructions',
    notes: 'malicious notes',
    cooking_speed: 'quick'
  }
  const expectedRecipe = {
    ...maliciousRecipe,
    title: 'Malicious Title',
    Ingredients: `malicious ingredients`
  }
  return {
    maliciousRecipe,
    expectedRecipe,
  }
}

module.exports = {
  makeRecipesArray,
  makeMaliciousRecipe,
}