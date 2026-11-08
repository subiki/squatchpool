import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecipe,validateRecipe} from '../src/creator-recipe.js';

test('creator can draft a known game',()=>{
 const result=createRecipe('press-your-luck','Rainforest Risk');
 assert.equal(result.ok,true);
 assert.equal(result.recipe.rules.raceTo,1);
});
test('rejects arbitrary executable fields',()=>{
 const recipe=createRecipe('caroms').recipe;
 assert.equal(validateRecipe({...recipe,script:'alert(1)'}).ok,false);
 assert.equal(validateRecipe({...recipe,rules:{...recipe.rules,onShot:'eval()'}}).ok,false);
});
test('rejects unsafe names and impossible rule bounds',()=>{
 const recipe=createRecipe('tuna').recipe;
 assert.equal(validateRecipe({...recipe,name:'<script>'}).ok,false);
 assert.equal(validateRecipe({...recipe,rules:{...recipe.rules,raceTo:100000}}).ok,false);
 assert.equal(validateRecipe({...recipe,baseGame:'not-a-game'}).ok,false);
});
test('returns a canonical, serializable recipe',()=>{
 const recipe=createRecipe('cutthroat','  My Game  ').recipe;
 assert.equal(recipe.name,'My Game');
 assert.deepEqual(JSON.parse(JSON.stringify(recipe)),recipe);
});
