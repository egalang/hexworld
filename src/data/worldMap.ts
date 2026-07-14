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
    title: "Mission 02",
    type: "mission",
    q: 1, r: 0,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
    title: "Training Mission 02",
    type: "training",
    q: 1, r: 1,
    iconId: "🛡️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: true,
  },
  {
    id: "mission_05",
    title: "Mission 05",
    type: "mission",
    q: 2, r: 1,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: false,
  },

  // Row 2
  {
    id: "training_01",
    title: "Training Mission 01",
    type: "training",
    q: 0, r: 2,
    iconId: "🛡️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: true,
  },
  {
    id: "mission_03",
    title: "Mission 03",
    type: "mission",
    q: 1, r: 2,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
    unlocked: false,
  },
  {
    id: "mission_04",
    title: "Mission 04",
    type: "mission",
    q: 2, r: 3,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
    unlocked: false,
  },

  // Row 4
  {
    id: "training_03",
    title: "Training Mission 03",
    type: "training",
    q: 0, r: 4,
    iconId: "🛡️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: true,
  },
  {
    id: "mission_06",
    title: "Mission 06",
    type: "mission",
    q: 1, r: 4,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: false,
  },
  {
    id: "mission_08",
    title: "Mission 08",
    type: "mission",
    q: 2, r: 4,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: false,
  },

  // Row 5
  {
    id: "mission_01",
    title: "Mission 01",
    type: "mission",
    q: 0, r: 5,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: false,
  },
  {
    id: "mission_07",
    title: "Mission 07",
    type: "mission",
    q: 1, r: 5,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: false,
  },
  {
    id: "mission_09",
    title: "Mission 09",
    type: "mission",
    q: 2, r: 5,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
    unlocked: false,
  },
  {
    id: "mission_10",
    title: "Mission 10",
    type: "mission",
    q: 1, r: 6,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
    title: "Mission 11",
    type: "mission",
    q: 0, r: 8,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
    title: "Mission 13",
    type: "mission",
    q: 2, r: 8,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: false,
  },

  // Row 9
  {
    id: "mission_12",
    title: "Mission 12",
    type: "mission",
    q: 0, r: 9,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
    unlocked: false,
  },

  // Row 10
  {
    id: "mission_15",
    title: "Mission 15",
    type: "mission",
    q: 0, r: 10,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
    unlocked: false,
  },
  {
    id: "mission_14",
    title: "Mission 14",
    type: "mission",
    q: 1, r: 10,
    iconId: "⚔️",
    buildingId: undefined,
    action: "scene",
    actionId: "HexConquestScene",
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
