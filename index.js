const axios = require('axios');
const groupBy = require('lodash/groupBy');
const padStart = require('lodash/padStart');

const config = require('./config');
const now = new Date();
const dateOfTheDay = `${padStart(now.getDate(), 2, '0')}/${padStart(now.getMonth() + 1, 2, '0')}`;

(async () => {
  const quests = (await axios.get(`${config.madAdminUrl}/get_quests`)).data;
  let pokeNavOutput = '';
  let summaryOutput = `*Rapport des quêtes du ${dateOfTheDay}*`;

  console.log(`#${quests.length} quests found`);

  let shinyPokemonIds = [];

  if (config.filterByShinyPokemon) {
    const shinyPokemon = (await axios.get(`https://pogoapi.net/api/v1/shiny_pokemon.json`)).data;
    shinyPokemonIds = Object.keys(shinyPokemon).map(id => parseInt(id));
  }

  const filteredQuests = quests
    .filter(quest => config.itemTypeFilter.indexOf(quest.item_type) > -1)
    .filter(quest => {
      if (quest.item_type !== 'Pokemon') {
        return true;
      }

      return (
        config.pokemonFilter.indexOf(quest.pokemon_name) > -1 ||
        config.pokemonFilter.indexOf(parseInt(quest.pokemon_id)) > -1 ||
        shinyPokemonIds.indexOf(parseInt(quest.pokemon_id)) > -1
      );
    })
    .sort((firstQuest, secondQuest) => {
      if (firstQuest.item_type === 'Pokemon' && secondQuest.item_type === 'Pokemon') {
        return parseInt(firstQuest.pokemon_id) - parseInt(secondQuest.pokemon_id);
      }

      return firstQuest.quest_reward_type_raw - secondQuest.quest_reward_type_raw;
    })
    .map(quest => {
      let rewardName = `${quest.item_amount} ${quest.item_type}`;

      if (quest.item_type === 'Pokemon') {
        rewardName = quest.pokemon_name;
      }

      return {
        ...quest,
        rewardName
      };
    });

  console.log(`#${filteredQuests.length} quests after filter`);

  filteredQuests.forEach(quest => {
    pokeNavOutput += `\n$q "${quest.rewardName}" "${quest.name}" "${quest.quest_task}"`;
  });

  console.log(pokeNavOutput);

  const groupedQuests = groupBy(filteredQuests, quest => {
    return quest.rewardName + '-' + quest.quest_task;
  });

  Object.values(groupedQuests).forEach(questsCollection => {
    const firstQuest = questsCollection[0];
    summaryOutput += `\n\n*Quête ${firstQuest.rewardName}* "${firstQuest.quest_task}"`;

    questsCollection.forEach(quest => {
      summaryOutput += `\n - ${quest.name}`;
    });
  });

  console.log(summaryOutput);
})();
