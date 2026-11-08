// Creator v0: portable, strictly declarative variants of existing Squatch games.
// This is an experimental recipe contract, NOT a gameplay interpreter yet.
// Never evaluate creator text or execute AI-generated JavaScript.
import {GAME_CATALOG} from './stats-games.js';

export const RECIPE_VERSION = 1;
const allowedGames = new Set(GAME_CATALOG.map(game => game.id));
const allowedTables = new Set([7,8,9]);
const allowedModes = new Set(['solo','local']);
const allowedCall = new Set(['game-default','required','optional']);
const allowedFoul = new Set(['game-default','ball-in-hand','turn-over']);
const MAX_NAME = 72;
const MAX_DESCRIPTION = 500;
const MAX_RACE = 15;
const plain = value => typeof value === 'string' && !/[<>\u0000-\u001f]/.test(value);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys) => Object.keys(value).every(key => keys.includes(key));
const fail = message => ({ok:false,error:message});

export function validateRecipe(value) {
  if (!object(value) || !exactKeys(value,['schemaVersion','baseGame','name','description','rules'])) return fail('Unknown recipe fields.');
  if (value.schemaVersion !== RECIPE_VERSION) return fail('Unsupported recipe version.');
  if (!allowedGames.has(value.baseGame)) return fail('Choose an existing Squatch game.');
  if (!plain(value.name) || value.name.trim().length < 3 || value.name.length > MAX_NAME) return fail('Name must be 3–72 plain-text characters.');
  if (!plain(value.description) || value.description.length > MAX_DESCRIPTION) return fail('Description must be plain text under 500 characters.');
  const rules=value.rules;
  if (!object(rules) || !exactKeys(rules,['tableFeet','mode','raceTo','calledPocket','foulPenalty'])) return fail('Unsupported rule fields.');
  if (!allowedTables.has(rules.tableFeet)) return fail('Table must be 7, 8, or 9 feet.');
  if (!allowedModes.has(rules.mode)) return fail('Unsupported player mode.');
  if (!Number.isInteger(rules.raceTo) || rules.raceTo < 1 || rules.raceTo > MAX_RACE) return fail('Race must be between 1 and 15.');
  if (!allowedCall.has(rules.calledPocket)) return fail('Unsupported called-pocket rule.');
  if (!allowedFoul.has(rules.foulPenalty)) return fail('Unsupported foul rule.');
  // Only options explicitly supported by the selected game controller can
  // become playable. This validator intentionally does NOT promise that.
  return {ok:true,recipe:{
    schemaVersion:RECIPE_VERSION,baseGame:value.baseGame,
    name:value.name.trim(),description:value.description.trim(),
    rules:{tableFeet:rules.tableFeet,mode:rules.mode,raceTo:rules.raceTo,
      calledPocket:rules.calledPocket,foulPenalty:rules.foulPenalty}
  }};
}

export function createRecipe(baseGame,name='My Squatch Game') {
  return validateRecipe({
    schemaVersion:RECIPE_VERSION,baseGame,name,description:'',
    rules:{tableFeet:7,mode:'local',raceTo:1,calledPocket:'game-default',foulPenalty:'game-default'}
  });
}
