import * as C from './colors';

export const Theme = {
  brand: {
    gold: C.ROYAL_GOLD,
    goldLight: C.BRIGHT_GOLD,
    goldDark: C.ANTIQUE_GOLD,
    silver: C.SILVER,
    darkSteel: C.DARK_STEEL,
    gunmetal: C.GUNMETAL,
    charcoal: C.CHARCOAL,
  },

  ui: {
    background: C.WINDOW_BG,
    panel: C.PANEL_BG,
    border: C.ROYAL_GOLD,
    borderHighlight: C.BRIGHT_GOLD,
    text: C.NORMAL_TEXT,
    textSecondary: C.SECONDARY_TEXT,
    textDescription: C.DESCRIPTION_TEXT,
    textTitle: C.TITLE_TEXT,
  },

  button: {
    primary: {
      bg: C.PRIMARY_BUTTON_BG,
      hover: C.PRIMARY_BUTTON_HOVER,
      pressed: C.PRIMARY_BUTTON_PRESSED,
      text: C.PRIMARY_BUTTON_TEXT,
    },
    secondary: {
      bg: C.SECONDARY_BUTTON_BG,
      hover: C.SECONDARY_BUTTON_HOVER,
      text: C.SECONDARY_BUTTON_TEXT,
    },
    disabled: {
      bg: C.DISABLED_BG,
      text: C.DISABLED_TEXT,
    },
  },

  battle: {
    blue: C.BATTLE_BLUE,
    red: C.BATTLE_RED,
    neutral: C.BATTLE_NEUTRAL,
    neutralStroke: C.GUNMETAL,
    selected: C.BRIGHT_GOLD,
    valid: C.VALID_MOVE,
  },

  status: {
    victory: C.STATUS_VICTORY,
    defeat: C.STATUS_DEFEAT,
    warning: C.STATUS_WARNING,
    info: C.STATUS_INFO,
  },

  reward: {
    gold: C.REWARD_GOLD,
    xp: C.REWARD_XP,
    weapon: C.REWARD_WEAPON,
    skill: C.REWARD_SKILL,
    unlock: C.REWARD_UNLOCK,
  },

  environment: {
    stone: C.STONE,
    lightStone: C.LIGHT_STONE,
    darkRock: C.DARK_ROCK,
    dirt: C.DIRT,
    wood: C.WOOD,
    darkWood: C.DARK_WOOD,
  },

  nature: {
    forest: C.FOREST_GREEN,
    pine: C.PINE,
    moss: C.MOSS,
    grass: C.GRASS_ACCENT,
  },

  water: {
    deep: C.DEEP_WATER,
    river: C.RIVER,
    highlight: C.WATER_HIGHLIGHT,
  },
};
