const axios = require('axios');

(async () => {
  const shinyPokemons = (await axios.get(`https://pogoapi.net/api/v1/shiny_pokemon.json`)).data;
  const shinyPokemonsIds = Object.keys(shinyPokemons).map(id => parseInt(id));
  console.log(JSON.stringify(shinyPokemonsIds));
})();
