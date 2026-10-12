import test from 'node:test'
import assert from 'node:assert/strict'
import { civicPriority, impactEstimate, incidentSchema } from '../lib/citysutra.ts'

test('priority renormalizes missing dimensions',()=>{const full=civicPriority({A:60,H:60,W:60,G:60});const missing=civicPriority({A:60,H:60,W:undefined,G:undefined});assert.equal(full.score,60);assert.equal(missing.score,60);assert.deepEqual(missing.missing,['W','G']);assert.equal(Object.values(missing.weights).reduce((a,b)=>a+b,0),1)})
test('interaction bonus is explicit and capped',()=>{assert.equal(civicPriority({A:100,H:100,W:100,G:100},[{label:'test',bonus:8}]).score,100)})
test('report schema rejects empty description',()=>{assert.equal(incidentSchema.safeParse({category:'open-burning',description:'',severity:3,latitude:28.6,longitude:77.2,locationLabel:'Delhi'}).success,false)})
test('impact calculation exposes scenario values',()=>{const result=impactEstimate(100,.5,.5,10,.2,.18);assert.equal(result.divertedKg,25);assert.equal(result.avoidedKm,2);assert.equal(result.estimatedCo2Kg,.36)})
