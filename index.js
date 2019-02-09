const axios = require('axios');

const config = require('./config');

(async () => {
  const quests = (await axios.get(`${config.madAdminUrl}/get_quests`)).data;
  let pokeNavOutput = '';
  let summaryOutput = '';

  console.log(`#${quests.length} quests found`);

  const filteredQuests = quests
    .filter(quest => config.itemTypeFilter.indexOf(quest.item_type) > -1)
    .filter(quest => {
      if (quest.item_type !== 'Pokemon') {
        return true;
      }

      return (
        config.pokemonFilter.indexOf(quest.pokemon_name) > -1 || config.pokemonFilter.indexOf(quest.pokemon_id) > -1
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
})();
