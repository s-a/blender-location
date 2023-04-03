/*
* Docs:
* https://docs.blender.org/manual/en/latest/advanced/blender_directory_layout.html
*/
import {execa} from 'execa'

import fs from 'fs'
import path from 'path'
import reg from 'native-reg'
import semver from 'semver'

function BlenderLocation() {
	return this
}

BlenderLocation.prototype.platform = function() {
	let result = 'linux'
	if (process.platform === 'win32') {
		result = 'win32'
	}
	if (process.platform === 'darwin') {
		result = 'macOS'
	}

	return result
}

BlenderLocation.prototype.extractVersionNumber = function (str) {
	const regex = /[0-9]\.[0-9]\.[0-9]/g
	const match = str.match(regex)
	return match ? match[0] : null
}

BlenderLocation.prototype.getBlenderExecutablePath = async function() {
	let result
	const platform = this.platform()
	switch (platform) {
	case 'win32':
		try {
			const key = reg.openKey(
				reg.HKLM,
				'SOFTWARE\\Classes\\blendfile\\shell\\open',
				reg.Access.READ)

			result = reg.getValue(key, 'command', null)
			reg.closeKey()
			result = (result || '').replace('"%1"', '').replace(/"/g, '').trim().replace('\\blender-launcher.exe', '\\blender.exe')
		} catch (error) {
			throw new Error('Blender is not installed or registry key not found')
		}
		break
	case 'macOS':
		result = '/Applications/Blender.app/Contents/MacOS/Blender'
		break
	case 'linux':
		result = '/usr/bin/blender'
		if (!fs.existsSync(result)) {
			result = '/usr/local/bin/blender'
			if (!fs.existsSync(result)) {
				result = path.join(process.env.HOME, 'software', 'blender', 'blender')
				if (!fs.existsSync(result)) {
					result = '/usr/share/blender'
					if (!fs.existsSync(result)) {
						result = (await execa('which', ['blender'])).stdout.toString().trim()
					}
				}
			}
		}
		break
	default:
		throw new Error(`Unsupported platform: ${platform}`)
	}

	if ((!result || !fs.existsSync(result))) {
		throw new Error(`Blender executable "${result || 'null'}" path could not be determined`)
	}

	return result
}

BlenderLocation.prototype.version = async function(exe) {
	// const exeVersion = spawnSync(exe, '-v')
	const exeVersion = await execa(exe, ['-v'])
	const v = this.extractVersionNumber(exeVersion.stdout)
	const result = semver.parse(semver.clean(v))
	return result
}

BlenderLocation.prototype.find = async function() {
	const exe = await this.getBlenderExecutablePath()
	const version = await this.version(exe)
	const result = {
		exe,
		version
	}

	return result
}

export default BlenderLocation