export type WorldTileType =
  | "profile"
  | "inventory"
  | "settings"
  | "training"
  | "mission"
  | "shop"
  | "pvp";

export type WorldTileAction = "scene" | "none";

export interface WorldTile {
  id: string;
  title: string;
  type: WorldTileType;
  q: number;
  r: number;
  iconId: string;
  buildingId?: string;
  action: WorldTileAction;
  actionId?: string;
  missionId?: string;
  shopCategory?: 'weapons' | 'skills';
  unlocked: boolean;
}

export const WORLD_TILES: WorldTile[] = [
  // Row 0
  {
    id: "player_inventory",
    title: "Player Inventory",
    type: "inventory",
    q: 0, r: 0,
    iconId: "📦",
    buildingId: undefined,
    action: "scene",
    actionId: "InventoryScene",
    unlocked: true,
  },
  {
    id: "mission_02",
    title: "Canyon Watch",
    type: "mission",
    q: 1, r: 0,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_02",
    unlocked: false,
  },

  // Row 1
  {
    id: "player_profile",
    title: "Player Profile",
    type: "profile",
    q: 0, r: 1,
    iconId: "👤",
    buildingId: undefined,
    action: "scene",
    actionId: "ProfileScene",
    unlocked: true,
  },
  {
    id: "training_02",
    title: "Holding Ground",
    type: "training",
    q: 1, r: 1,
    iconId: "🛡️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "training_02",
    unlocked: true,
  },
  {
    id: "mission_05",
    title: "Forest Clearing",
    type: "mission",
    q: 2, r: 1,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_05",
    unlocked: false,
  },

  // Row 2
  {
    id: "training_01",
    title: "Basic Training",
    type: "training",
    q: 0, r: 2,
    iconId: "🛡️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "training_01",
    unlocked: true,
  },
  {
    id: "mission_03",
    title: "Riverside Skirmish",
    type: "mission",
    q: 1, r: 2,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_03",
    unlocked: false,
  },

  // Row 3
  {
    id: "game_settings",
    title: "Game Settings",
    type: "settings",
    q: 0, r: 3,
    iconId: "⚙️",
    buildingId: undefined,
    action: "scene",
    actionId: "SettingsScene",
    unlocked: true,
  },
  {
    id: "weapon_shop_01",
    title: "Weapon Shop 01",
    type: "shop",
    q: 1, r: 3,
    iconId: "🔧",
    buildingId: undefined,
    action: "scene",
    actionId: "ShopScene",
    shopCategory: "weapons",
    unlocked: true,
  },
  {
    id: "mission_04",
    title: "Hilltop Assault",
    type: "mission",
    q: 2, r: 3,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_04",
    unlocked: false,
  },
  {
    id: "rune_shop_01",
    title: "Rune Shop 01",
    type: "shop",
    q: 3, r: 3,
    iconId: "🔮",
    buildingId: undefined,
    action: "scene",
    actionId: "ShopScene",
    shopCategory: "skills",
    unlocked: true,
  },

  // Row 4
  {
    id: "training_03",
    title: "Advance and Capture",
    type: "training",
    q: 0, r: 4,
    iconId: "🛡️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "training_03",
    unlocked: true,
  },
  {
    id: "mission_06",
    title: "Desert Patrol",
    type: "mission",
    q: 1, r: 4,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_06",
    unlocked: false,
  },
  {
    id: "mission_08",
    title: "Sandstorm Advance",
    type: "mission",
    q: 2, r: 4,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_08",
    unlocked: false,
  },

  // Row 5
  {
    id: "mission_01",
    title: "Forest Outpost",
    type: "mission",
    q: 0, r: 5,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_01",
    unlocked: false,
  },
  {
    id: "mission_07",
    title: "Oasis Control",
    type: "mission",
    q: 1, r: 5,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_07",
    unlocked: false,
  },
  {
    id: "mission_09",
    title: "Dunes Stand",
    type: "mission",
    q: 2, r: 5,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_09",
    unlocked: false,
  },

  // Row 6
  {
    id: "armor_shop_02",
    title: "Armor Shop 02",
    type: "shop",
    q: 0, r: 6,
    iconId: "🛡️",
    buildingId: undefined,
    action: "scene",
    actionId: "ShopScene",
    shopCategory: "weapons",
    unlocked: false,
  },
  {
    id: "mission_10",
    title: "Mirage Fortress",
    type: "mission",
    q: 1, r: 6,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_10",
    unlocked: false,
  },
  {
    id: "pvp_01",
    title: "PvP 01",
    type: "pvp",
    q: 2, r: 6,
    iconId: "🏆",
    buildingId: undefined,
    action: "scene",
    actionId: "OnlineLobbyScene",
    unlocked: false,
  },

  // Row 7
  {
    id: "pvp_03",
    title: "PvP 03",
    type: "pvp",
    q: 0, r: 7,
    iconId: "🏆",
    buildingId: undefined,
    action: "scene",
    actionId: "OnlineLobbyScene",
    unlocked: false,
  },
  {
    id: "pvp_02",
    title: "PvP 02",
    type: "pvp",
    q: 1, r: 7,
    iconId: "🏆",
    buildingId: undefined,
    action: "scene",
    actionId: "OnlineLobbyScene",
    unlocked: false,
  },
  {
    id: "pvp_05",
    title: "PvP 05",
    type: "pvp",
    q: 2, r: 7,
    iconId: "🏆",
    buildingId: undefined,
    action: "scene",
    actionId: "OnlineLobbyScene",
    unlocked: false,
  },

  // Row 8
  {
    id: "mission_11",
    title: "Mountain Pass",
    type: "mission",
    q: 0, r: 8,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_11",
    unlocked: false,
  },
  {
    id: "pvp_04",
    title: "PvP 04",
    type: "pvp",
    q: 1, r: 8,
    iconId: "🏆",
    buildingId: undefined,
    action: "scene",
    actionId: "OnlineLobbyScene",
    unlocked: false,
  },
  {
    id: "mission_13",
    title: "Avalanche Strike",
    type: "mission",
    q: 2, r: 8,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_13",
    unlocked: false,
  },

  // Row 9
  {
    id: "mission_12",
    title: "Peak Control",
    type: "mission",
    q: 0, r: 9,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_12",
    unlocked: false,
  },
  {
    id: "scroll_shop",
    title: "Scroll Shop",
    type: "shop",
    q: 1, r: 9,
    iconId: "📜",
    buildingId: undefined,
    action: "scene",
    actionId: "ShopScene",
    shopCategory: "skills",
    unlocked: false,
  },

  // Row 10
  {
    id: "mission_15",
    title: "Final Conquest",
    type: "mission",
    q: 0, r: 10,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_15",
    unlocked: false,
  },
  {
    id: "mission_14",
    title: "Summit Fortress",
    type: "mission",
    q: 1, r: 10,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    missionId: "mission_14",
    unlocked: false,
  },
];

export const TILE_COLORS: Record<WorldTileType, string> = {
  profile: "#FFF5E1",
  inventory: "#FFF5E1",
  settings: "#FFF5E1",
  training: "#C8E6C9",
  mission: "#BBDEFB",
  shop: "#E1BEE7",
  pvp: "#F8BBD0",
};

export function getTileById(id: string): WorldTile | undefined {
  return WORLD_TILES.find((t) => t.id === id);
}
