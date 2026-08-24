declare function getPattern(): RegExp;
/**
 * A list of bot identifiers to be used in a regular expression against user agent strings.
 */
declare const list: string[];
/**
 * Check if the given user agent includes a bot pattern.
 */
declare function isBot(userAgent?: string | null): boolean;
/**
 * Check if the given user agent includes a bot pattern. Naive implementation (less accurate).
 */
declare const isBotNaive: typeof isBot;
/**
 * Create a custom isBot function with a custom pattern.
 */
declare const createIsBot: (customPattern: RegExp) => typeof isBot;
/**
 * Create a custom isBot function with a custom pattern.
 */
declare const createIsBotFromList: (list: string[]) => typeof isBot;
/**
 * Find the first part of the user agent that matches a bot pattern.
 */
declare const findBotMatch: (userAgent: Parameters<typeof isBot>[0]) => string | null;
/**
 * Find all parts of the user agent that match a bot pattern.
 */
declare const findBotMatches: (userAgent: Parameters<typeof isBot>[0]) => string[];
/**
 * Find the first bot pattern that match the given user agent.
 */
declare const findBotPattern: (userAgent: Parameters<typeof isBot>[0]) => string | null;
/**
 * Find all bot patterns that match the given user agent.
 */
declare const findBotPatterns: (userAgent: Parameters<typeof isBot>[0]) => string[];
/**
 * Check if the given user agent includes a bot pattern.
 */
declare const isbot: typeof isBot;
/**
 * Check if the given user agent includes a bot pattern. Naive implementation (less accurate).
 */
declare const isbotNaive: typeof isBot;
/**
 * Create a custom isBot function with a custom pattern.
 */
declare const createIsbot: (customPattern: RegExp) => typeof isBot;
/**
 * Create a custom isBot function with a custom pattern.
 */
declare const createIsbotFromList: (list: string[]) => typeof isBot;
/**
 * Find the first part of the user agent that matches a bot pattern.
 */
declare const isbotMatch: (userAgent: Parameters<typeof isBot>[0]) => string | null;
/**
 * Find all parts of the user agent that match a bot pattern.
 */
declare const isbotMatches: (userAgent: Parameters<typeof isBot>[0]) => string[];
/**
 * Find the first bot pattern that match the given user agent.
 */
declare const isbotPattern: (userAgent: Parameters<typeof isBot>[0]) => string | null;
/**
 * Find all bot patterns that match the given user agent.
 */
declare const isbotPatterns: (userAgent: Parameters<typeof isBot>[0]) => string[];

export { createIsBot, createIsBotFromList, createIsbot, createIsbotFromList, findBotMatch, findBotMatches, findBotPattern, findBotPatterns, getPattern, isBot, isBotNaive, isbot, isbotMatch, isbotMatches, isbotNaive, isbotPattern, isbotPatterns, list };
