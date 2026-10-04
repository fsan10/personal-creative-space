import assert from 'node:assert/strict';
import {hslToHex} from '../lib/color.ts';
assert.equal(hslToHex(0,100,50),'#ff0000');assert.equal(hslToHex(120,100,50),'#00ff00');assert.equal(hslToHex(240,100,50),'#0000ff');assert.equal(hslToHex(25,0,100),'#ffffff');assert.equal(hslToHex(25,0,0),'#000000');console.log('Palette color conversion checks passed');
