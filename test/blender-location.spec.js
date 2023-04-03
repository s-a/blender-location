const fs = require('fs')
const assert = require('assert')
const BlenderLocation = require('..')
const semver = require('semver')

describe('Blender Location', function () {
	it('should return location of blender executable', async function () {
		const blenderLocation = new BlenderLocation()
		const res = blenderLocation.find()
		// console.log(res)
		assert.deepStrictEqual(fs.existsSync(res.exe), true, 'could not determine blender executable path')
		assert.deepStrictEqual(fs.existsSync(res.path.user), true, 'could not determine blender user path')
		assert.deepStrictEqual(fs.existsSync(res.path.system), true, 'could not determine blender system path')
		assert.deepStrictEqual(semver.gte(res.version.version, '3.4.0'), true, 'expected blender version to be greater than 3.4.0')
	})
})