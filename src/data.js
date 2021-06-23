// Default word list
export const words = ['frost', 'ghost', 'froze', 'glaze', 'plaza', 'prose', 'floss', 'piece', 'mists', 'maize', 'mango', 'tango', 'trash', 'teach', 'lease', 'leach', 'tease', 'abode', 'blows', 'brats', 'blaze', 'broom', 'heist', 'halos', 'plots', 'tarot', 'rooms', 'terms', 'biome', 'vault'];

// Allowed Characters
export const chars = ['[', '{', '(', '<', '*', '_', '/', '\\', '\'', '`', '.', '$', '=', '+', '@', '|', ';', ':', '^', '?', '#', '-', '!', '"', '>', ')', '}', ']', 'w', 'w']; // (w is replaced with a word)

// Actions on commands, adjust to change frequency of tries reset / dud removed.
export const actions = ['d','d','d','d','d','d','t','t','t','d'];

// Command openers and closers
export const cmdOpeners = ['<', '{', '[', '(']; // command opener chars
export const cmdClosers = ['>', '}', ']', ')']; // command closer chars
