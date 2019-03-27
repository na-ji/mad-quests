const axios = require('axios');
const fs = require('fs');
const geolib = require('geolib');
const groupBy = require('lodash/groupBy');
const padStart = require('lodash/padStart');

const config = require('./config');
const now = new Date();
const dateOfTheDay = `${padStart(now.getDate(), 2, '0')}/${padStart(now.getMonth() + 1, 2, '0')}`;

const getGeofence = geofencePath => {
  const geofence = [];
  const fileContent = fs.readFileSync(geofencePath, 'utf-8');

  fileContent.split(/\r?\n/).forEach(function(line) {
    const regex = /(\d+.\d+),(\d+.\d+)/;
    const coordinates = regex.exec(line);

    if (Array.isArray(coordinates)) {
      geofence.push({ latitude: parseFloat(coordinates[1]), longitude: parseFloat(coordinates[2]) });
    }
  });

  return geofence;
};

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

const sendWebhook = async message => {
  if (!config.webhookUrl) {
    return;
  }

  try {
    await axios.post(config.webhookUrl, {
      content: message
    });
    await sleep(500);
  } catch (error) {
    const response = error.response;
    const responseContent = response.data;

    if (response.status === 429) {
      console.log(`waiting ${responseContent.retry_after}ms`);
      await sleep(responseContent.retry_after);
      await sendWebhook(message);
    }
  }
};

const filterQuests = async (questCollection, config) => {
  let shinyPokemonIds = [];

  if (config.filterByShinyPokemon) {
    const shinyPokemon = (await axios.get(`https://pogoapi.net/api/v1/shiny_pokemon.json`)).data;
    shinyPokemonIds = Object.keys(shinyPokemon).map(id => parseInt(id));
  }

  let filterByGeofence = () => true;
  if (config.geofence) {
    const geofence = getGeofence(config.geofence);

    filterByGeofence = quest => {
      return geolib.isPointInside({ latitude: quest.latitude, longitude: quest.longitude }, geofence);
    };
  }

  const filteredQuests = questCollection
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
    .filter(filterByGeofence)
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

  console.log(`\n#${filteredQuests.length} quests after filter`);

  return filteredQuests;
};

(async () => {
  const quests = (await axios.get(`${config.madAdminUrl}/get_quests`)).data;

  console.log(`#${quests.length} quests found`);

  if (config.pokenavOutput) {
    const pokeNavQuests = await filterQuests([...quests], config.pokenavOutput);
    let pokeNavOutput = '';

    for (let quest of pokeNavQuests) {
      const questCommand = `$q "${quest.rewardName}" "${quest.name}" "${quest.quest_task}"`;
      pokeNavOutput += `\n${questCommand}`;
      await sendWebhook(questCommand);
    }

    console.log(pokeNavOutput);
  }

  if (config.summaryOutput) {
    const summaryQuests = await filterQuests([...quests], config.summaryOutput);
    let summaryOutput = `\n*Rapport des quêtes du ${dateOfTheDay}*`;

    const groupedQuests = groupBy(summaryQuests, quest => {
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
  }
})();
