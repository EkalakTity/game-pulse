export type CatalogFeed = {
  name: string;
  url: string;
  description: string;
  logoUrl?: string;
  fetchIntervalMin: number;
};

export type CatalogGame = {
  slug: string;
  name: string;
  genre: string;
  aliases: string[];
  imageUrl?: string;
  feeds: CatalogFeed[];
};

export const GENERAL_GAMING_FEEDS: CatalogFeed[] = [
  { name: "IGN", url: "https://feeds.ign.com/ign/games", description: "IGN gaming news & reviews", logoUrl: "https://assets-prd.ignimgs.com/2022/04/15/ign-favicon-1649957166423.png", fetchIntervalMin: 15 },
  { name: "GameSpot", url: "https://www.gamespot.com/feeds/mashup/", description: "GameSpot news and reviews", fetchIntervalMin: 15 },
  { name: "Kotaku", url: "https://kotaku.com/rss", description: "Kotaku gaming culture", fetchIntervalMin: 30 },
  { name: "Polygon", url: "https://www.polygon.com/rss/index.xml", description: "Polygon game news & guides", fetchIntervalMin: 30 },
  { name: "PC Gamer", url: "https://www.pcgamer.com/rss/", description: "PC Gamer news and reviews", fetchIntervalMin: 30 },
  { name: "Eurogamer", url: "https://www.eurogamer.net/?format=rss", description: "Eurogamer news and analysis", fetchIntervalMin: 30 },
  { name: "Rock Paper Shotgun", url: "https://www.rockpapershotgun.com/feed", description: "PC gaming news from RPS", fetchIntervalMin: 30 },
  { name: "VG247", url: "https://www.vg247.com/feed/", description: "VG247 gaming news", fetchIntervalMin: 30 },
  { name: "GamesRadar", url: "https://www.gamesradar.com/rss/", description: "GamesRadar news and reviews", fetchIntervalMin: 30 },
  { name: "Destructoid", url: "https://www.destructoid.com/feed/", description: "Destructoid gaming news", fetchIntervalMin: 30 },
];

export const GAME_CATALOG: CatalogGame[] = [
  {
    slug: "minecraft",
    name: "Minecraft",
    genre: "Sandbox",
    aliases: ["mc", "mojang"],
    imageUrl: "https://www.minecraft.net/content/dam/games/minecraft/key-art/Games_Subnav_Minecraft-300x465.jpg",
    feeds: [
      { name: "r/Minecraft", url: "https://www.reddit.com/r/Minecraft/.rss", description: "Minecraft community subreddit", fetchIntervalMin: 60 },
      { name: "r/feedthebeast", url: "https://www.reddit.com/r/feedthebeast/.rss", description: "Minecraft modpack community", fetchIntervalMin: 60 },
      { name: "Minecraft.net News", url: "https://www.minecraft.net/en-us/feeds/community-content/guides", description: "Official Minecraft community guides", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "fortnite",
    name: "Fortnite",
    genre: "Battle Royale",
    aliases: ["fn", "epic fortnite"],
    feeds: [
      { name: "r/FortNiteBR", url: "https://www.reddit.com/r/FortNiteBR/.rss", description: "Fortnite Battle Royale community", fetchIntervalMin: 60 },
      { name: "r/FortniteCompetitive", url: "https://www.reddit.com/r/FortniteCompetitive/.rss", description: "Fortnite competitive scene", fetchIntervalMin: 60 },
    ],
  },
  {
    slug: "league-of-legends",
    name: "League of Legends",
    genre: "MOBA",
    aliases: ["lol", "league", "riot"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2300650/header.jpg",
    feeds: [
      { name: "r/leagueoflegends", url: "https://www.reddit.com/r/leagueoflegends/.rss", description: "League of Legends community", fetchIntervalMin: 30 },
      { name: "r/leagueofjinx", url: "https://www.reddit.com/r/leagueofjinx/.rss", description: "LoL fan art and memes", fetchIntervalMin: 60 },
    ],
  },
  {
    slug: "valorant",
    name: "Valorant",
    genre: "Tactical Shooter",
    aliases: ["val", "riot valorant"],
    feeds: [
      { name: "r/VALORANT", url: "https://www.reddit.com/r/VALORANT/.rss", description: "Valorant community subreddit", fetchIntervalMin: 30 },
      { name: "r/ValorantCompetitive", url: "https://www.reddit.com/r/ValorantCompetitive/.rss", description: "Valorant esports and competitive", fetchIntervalMin: 60 },
    ],
  },
  {
    slug: "cs2",
    name: "Counter-Strike 2",
    genre: "Tactical Shooter",
    aliases: ["cs2", "csgo", "counter strike", "cs:go"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
    feeds: [
      { name: "r/GlobalOffensive", url: "https://www.reddit.com/r/GlobalOffensive/.rss", description: "CS2 / CS:GO community", fetchIntervalMin: 30 },
      { name: "CS2 Steam News", url: "https://store.steampowered.com/feeds/news/app/730/?cc=US&l=english&ndl=1", description: "Official CS2 Steam news", fetchIntervalMin: 120 },
    ],
  },
  {
    slug: "dota-2",
    name: "Dota 2",
    genre: "MOBA",
    aliases: ["dota", "dota2"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
    feeds: [
      { name: "r/DotA2", url: "https://www.reddit.com/r/DotA2/.rss", description: "Dota 2 community", fetchIntervalMin: 30 },
      { name: "Dota 2 Steam News", url: "https://store.steampowered.com/feeds/news/app/570/?cc=US&l=english&ndl=1", description: "Official Dota 2 updates", fetchIntervalMin: 120 },
    ],
  },
  {
    slug: "apex-legends",
    name: "Apex Legends",
    genre: "Battle Royale",
    aliases: ["apex", "apex legends"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg",
    feeds: [
      { name: "r/apexlegends", url: "https://www.reddit.com/r/apexlegends/.rss", description: "Apex Legends community", fetchIntervalMin: 30 },
      { name: "Apex Steam News", url: "https://store.steampowered.com/feeds/news/app/1172470/?cc=US&l=english&ndl=1", description: "Official Apex Legends updates", fetchIntervalMin: 120 },
    ],
  },
  {
    slug: "elden-ring",
    name: "Elden Ring",
    genre: "Action RPG",
    aliases: ["elden", "fromsoft", "from software"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    feeds: [
      { name: "r/Eldenring", url: "https://www.reddit.com/r/Eldenring/.rss", description: "Elden Ring community", fetchIntervalMin: 60 },
      { name: "Elden Ring Steam News", url: "https://store.steampowered.com/feeds/news/app/1245620/?cc=US&l=english&ndl=1", description: "Official Elden Ring updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "cyberpunk-2077",
    name: "Cyberpunk 2077",
    genre: "Action RPG",
    aliases: ["cyberpunk", "cp2077", "cdpr"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
    feeds: [
      { name: "r/cyberpunkgame", url: "https://www.reddit.com/r/cyberpunkgame/.rss", description: "Cyberpunk 2077 community", fetchIntervalMin: 60 },
      { name: "Cyberpunk Steam News", url: "https://store.steampowered.com/feeds/news/app/1091500/?cc=US&l=english&ndl=1", description: "Official Cyberpunk 2077 updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "baldurs-gate-3",
    name: "Baldur's Gate 3",
    genre: "RPG",
    aliases: ["bg3", "baldurs gate", "larian"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg",
    feeds: [
      { name: "r/BaldursGate3", url: "https://www.reddit.com/r/BaldursGate3/.rss", description: "Baldur's Gate 3 community", fetchIntervalMin: 60 },
      { name: "BG3 Steam News", url: "https://store.steampowered.com/feeds/news/app/1086940/?cc=US&l=english&ndl=1", description: "Official BG3 updates from Larian", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "gta-v",
    name: "GTA V / GTA Online",
    genre: "Open World",
    aliases: ["gta", "grand theft auto", "gta5", "gta online", "rockstar"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg",
    feeds: [
      { name: "r/gtaonline", url: "https://www.reddit.com/r/gtaonline/.rss", description: "GTA Online community", fetchIntervalMin: 60 },
      { name: "r/GrandTheftAutoV", url: "https://www.reddit.com/r/GrandTheftAutoV/.rss", description: "GTA V story mode community", fetchIntervalMin: 60 },
      { name: "GTA V Steam News", url: "https://store.steampowered.com/feeds/news/app/271590/?cc=US&l=english&ndl=1", description: "Official GTA V Steam updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "overwatch-2",
    name: "Overwatch 2",
    genre: "Hero Shooter",
    aliases: ["overwatch", "ow2", "ow", "blizzard overwatch"],
    feeds: [
      { name: "r/Overwatch", url: "https://www.reddit.com/r/Overwatch/.rss", description: "Overwatch community", fetchIntervalMin: 30 },
      { name: "r/OverwatchUniversity", url: "https://www.reddit.com/r/OverwatchUniversity/.rss", description: "Overwatch coaching and tips", fetchIntervalMin: 60 },
    ],
  },
  {
    slug: "diablo-iv",
    name: "Diablo IV",
    genre: "Action RPG",
    aliases: ["diablo", "d4", "diablo 4", "blizzard diablo"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2344520/header.jpg",
    feeds: [
      { name: "r/diablo4", url: "https://www.reddit.com/r/diablo4/.rss", description: "Diablo IV community", fetchIntervalMin: 30 },
      { name: "Diablo IV Steam News", url: "https://store.steampowered.com/feeds/news/app/2344520/?cc=US&l=english&ndl=1", description: "Official Diablo IV updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "world-of-warcraft",
    name: "World of Warcraft",
    genre: "MMORPG",
    aliases: ["wow", "warcraft", "wow classic"],
    feeds: [
      { name: "r/wow", url: "https://www.reddit.com/r/wow/.rss", description: "World of Warcraft community", fetchIntervalMin: 30 },
      { name: "r/classicwow", url: "https://www.reddit.com/r/classicwow/.rss", description: "WoW Classic community", fetchIntervalMin: 60 },
    ],
  },
  {
    slug: "stardew-valley",
    name: "Stardew Valley",
    genre: "Farming Sim",
    aliases: ["stardew", "sdv", "concernedape"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
    feeds: [
      { name: "r/StardewValley", url: "https://www.reddit.com/r/StardewValley/.rss", description: "Stardew Valley community", fetchIntervalMin: 60 },
      { name: "Stardew Steam News", url: "https://store.steampowered.com/feeds/news/app/413150/?cc=US&l=english&ndl=1", description: "Official Stardew Valley updates", fetchIntervalMin: 720 },
    ],
  },
  {
    slug: "terraria",
    name: "Terraria",
    genre: "Sandbox",
    aliases: ["terraria", "re-logic"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg",
    feeds: [
      { name: "r/Terraria", url: "https://www.reddit.com/r/Terraria/.rss", description: "Terraria community", fetchIntervalMin: 60 },
      { name: "Terraria Steam News", url: "https://store.steampowered.com/feeds/news/app/105600/?cc=US&l=english&ndl=1", description: "Official Terraria updates", fetchIntervalMin: 720 },
    ],
  },
  {
    slug: "hades",
    name: "Hades",
    genre: "Roguelite",
    aliases: ["hades", "supergiant", "hades 2"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    feeds: [
      { name: "r/HadesTheGame", url: "https://www.reddit.com/r/HadesTheGame/.rss", description: "Hades community", fetchIntervalMin: 60 },
      { name: "Hades Steam News", url: "https://store.steampowered.com/feeds/news/app/1145360/?cc=US&l=english&ndl=1", description: "Official Hades updates", fetchIntervalMin: 720 },
    ],
  },
  {
    slug: "rust",
    name: "Rust",
    genre: "Survival",
    aliases: ["rust", "facepunch"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/header.jpg",
    feeds: [
      { name: "r/playrust", url: "https://www.reddit.com/r/playrust/.rss", description: "Rust survival game community", fetchIntervalMin: 30 },
      { name: "Rust Steam News", url: "https://store.steampowered.com/feeds/news/app/252490/?cc=US&l=english&ndl=1", description: "Official Rust updates (monthly wipe news)", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "valheim",
    name: "Valheim",
    genre: "Survival",
    aliases: ["valheim", "iron gate"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/892970/header.jpg",
    feeds: [
      { name: "r/valheim", url: "https://www.reddit.com/r/valheim/.rss", description: "Valheim Viking survival community", fetchIntervalMin: 60 },
      { name: "Valheim Steam News", url: "https://store.steampowered.com/feeds/news/app/892970/?cc=US&l=english&ndl=1", description: "Official Valheim updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "path-of-exile",
    name: "Path of Exile",
    genre: "Action RPG",
    aliases: ["poe", "path of exile", "poe2"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/238960/header.jpg",
    feeds: [
      { name: "r/pathofexile", url: "https://www.reddit.com/r/pathofexile/.rss", description: "Path of Exile community", fetchIntervalMin: 30 },
      { name: "PoE Steam News", url: "https://store.steampowered.com/feeds/news/app/238960/?cc=US&l=english&ndl=1", description: "Official Path of Exile updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "final-fantasy-xiv",
    name: "Final Fantasy XIV",
    genre: "MMORPG",
    aliases: ["ffxiv", "ff14", "final fantasy 14", "square enix"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/39210/header.jpg",
    feeds: [
      { name: "r/ffxiv", url: "https://www.reddit.com/r/ffxiv/.rss", description: "FFXIV community", fetchIntervalMin: 30 },
      { name: "FFXIV Steam News", url: "https://store.steampowered.com/feeds/news/app/39210/?cc=US&l=english&ndl=1", description: "Official FFXIV updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "warframe",
    name: "Warframe",
    genre: "Action",
    aliases: ["warframe", "digital extremes", "de"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/230410/header.jpg",
    feeds: [
      { name: "r/Warframe", url: "https://www.reddit.com/r/Warframe/.rss", description: "Warframe community", fetchIntervalMin: 30 },
      { name: "Warframe Steam News", url: "https://store.steampowered.com/feeds/news/app/230410/?cc=US&l=english&ndl=1", description: "Official Warframe devstream & patch notes", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "destiny-2",
    name: "Destiny 2",
    genre: "FPS RPG",
    aliases: ["destiny", "d2", "bungie"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg",
    feeds: [
      { name: "r/DestinyTheGame", url: "https://www.reddit.com/r/DestinyTheGame/.rss", description: "Destiny 2 community", fetchIntervalMin: 30 },
      { name: "Destiny 2 Steam News", url: "https://store.steampowered.com/feeds/news/app/1085660/?cc=US&l=english&ndl=1", description: "Official Destiny 2 updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "pokemon",
    name: "Pokémon",
    genre: "RPG",
    aliases: ["pokemon", "pokedex", "nintendo pokemon"],
    feeds: [
      { name: "r/pokemon", url: "https://www.reddit.com/r/pokemon/.rss", description: "Pokémon community", fetchIntervalMin: 30 },
      { name: "r/PokemonGO", url: "https://www.reddit.com/r/TheSilphRoad/.rss", description: "Pokémon GO community hub", fetchIntervalMin: 60 },
    ],
  },
  {
    slug: "zelda",
    name: "The Legend of Zelda",
    genre: "Action Adventure",
    aliases: ["zelda", "botw", "totk", "tears of the kingdom", "breath of the wild", "nintendo zelda"],
    feeds: [
      { name: "r/zelda", url: "https://www.reddit.com/r/zelda/.rss", description: "Zelda series community", fetchIntervalMin: 60 },
      { name: "r/Breath_of_the_Wild", url: "https://www.reddit.com/r/Breath_of_the_Wild/.rss", description: "BotW / TotK community", fetchIntervalMin: 60 },
    ],
  },
  {
    slug: "monster-hunter",
    name: "Monster Hunter",
    genre: "Action RPG",
    aliases: ["mh", "monster hunter wilds", "mhw", "capcom monster hunter"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/2246340/header.jpg",
    feeds: [
      { name: "r/MonsterHunter", url: "https://www.reddit.com/r/MonsterHunter/.rss", description: "Monster Hunter series community", fetchIntervalMin: 60 },
      { name: "MH Wilds Steam News", url: "https://store.steampowered.com/feeds/news/app/2246340/?cc=US&l=english&ndl=1", description: "Official Monster Hunter Wilds updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "deep-rock-galactic",
    name: "Deep Rock Galactic",
    genre: "Co-op Shooter",
    aliases: ["drg", "deep rock", "ghost ship"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/548430/header.jpg",
    feeds: [
      { name: "r/DeepRockGalactic", url: "https://www.reddit.com/r/DeepRockGalactic/.rss", description: "Deep Rock Galactic community", fetchIntervalMin: 60 },
      { name: "DRG Steam News", url: "https://store.steampowered.com/feeds/news/app/548430/?cc=US&l=english&ndl=1", description: "Official Deep Rock Galactic updates", fetchIntervalMin: 360 },
    ],
  },
  {
    slug: "hollow-knight",
    name: "Hollow Knight",
    genre: "Metroidvania",
    aliases: ["hollow knight", "hk", "team cherry", "silksong"],
    imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
    feeds: [
      { name: "r/HollowKnight", url: "https://www.reddit.com/r/HollowKnight/.rss", description: "Hollow Knight community", fetchIntervalMin: 60 },
      { name: "HK Steam News", url: "https://store.steampowered.com/feeds/news/app/367520/?cc=US&l=english&ndl=1", description: "Official Hollow Knight updates", fetchIntervalMin: 720 },
    ],
  },
  {
    slug: "call-of-duty",
    name: "Call of Duty",
    genre: "FPS",
    aliases: ["cod", "warzone", "modern warfare", "activision cod", "call of duty warzone"],
    feeds: [
      { name: "r/CODWarzone", url: "https://www.reddit.com/r/CODWarzone/.rss", description: "Call of Duty Warzone community", fetchIntervalMin: 30 },
      { name: "r/modernwarfare", url: "https://www.reddit.com/r/modernwarfare/.rss", description: "Modern Warfare community", fetchIntervalMin: 60 },
    ],
  },
];

export function searchCatalog(query: string): CatalogGame[] {
  if (!query.trim()) return GAME_CATALOG;
  const q = query.toLowerCase().trim();
  return GAME_CATALOG.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.slug.includes(q) ||
      g.aliases.some((a) => a.includes(q)),
  );
}
