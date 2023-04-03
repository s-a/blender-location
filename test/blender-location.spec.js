import fs from 'fs'
import assert from 'assert'
import BlenderLocation from '../index.js'
import semver from 'semver'

describe('Blender Location', function () {
	it('should return location of blender executable', async function () {
		this.timeout(4000)
		const blenderLocation = new BlenderLocation()
		const res = await blenderLocation.find()
		assert.deepStrictEqual(fs.existsSync(res.exe), true, 'could not determine blender executable path')
		assert.deepStrictEqual(semver.gte(res.version.version, '1.0.0'), true, 'expected blender version to be greater than 3.4.0')
	})
})