# MAD's quests
A quick script I made to fetch the quests from [MAD](https://github.com/Map-A-Droid/MAD)'s and format them for two outputs: the first one is a [PokeNav](https://pokenavbot.com/) compatible output and the second one is a text summary output.

## Installation
```
git clone https://github.com/na-ji/mad-quests.git
cd mad-quests
yarn # or `npm install`
cp config.json.dist config.json
```

## Configuration
The only required configuration is `madAdminUrl`, which is the URL of MADmin.
 - `madAdminUrl` **required** (`String`): URL of MADmin
 - `webhookUrl` (`String|null`): If you want to post your pokenav commands directly to Discord, you can fill this field with a Discord webhook URL.
 - `pokenavOutput` and `summaryOutput`: those fields accept the same sub properties. This object is used to filters the quests. If you want to disable an output, you can put those fields to `null`. Every **filters depends on MAD's locale**: if your MAD is in french, put the filters in french.
   - `itemTypeFilter` (`Array<String>`): which kind of quest reward to accept. Can be `Pokemon`, `Rare Candy`, `Stardust` etc.
   - `filterByShinyPokemon` (`Boolean`): automatically accept every pokemon that can be shiny
   - `geofence` (`String`): if you want to filters quests by localisation, you can add a geofence in the geofences folder and reference it here. Exemple: `geofences/QUESTS.txt`
   - `pokemonFilter`(`Array<String>`): which pokemon to accept

## Usage
```
node index.js
```

## Output example
```text
#153 quests found

#3 quests after filter

$q "1500 Poussières Étoiles" "Fontaine De La Cour " "Attrape 15 Pokémon Insecte."
$q "Évoli" "Coccinelles de Bussy" "Fais évoluer 1 Pokémon."
$q "Ningale" "Rond Point De Meiningen " "Evolve 3 Insecte Pokemon"

#2 quests after filter

*Rapport des quêtes du 03/04*

*Quête Insécateur* "Attrape 10 Pokémon Insecte."
 - Clock at Station Square

*Quête Ningale* "Evolve 3 Insecte Pokemon"
 - Tables De Ping-pong 
```