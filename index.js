/*
* Docs:
* https://docs.blender.org/manual/en/latest/advanced/blender_directory_layout.html
*/
const os = require('os')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const reg = require('native-reg')
const semver = require('semver')

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

BlenderLocation.prototype.locations = function() {
	const locations = {
		win32: {
			user: '%USERPROFILE%\\AppData\\Roaming\\Blender Foundation\\Blender',
			system: '%USERPROFILE%\\AppData\\Roaming\\Blender Foundation\\Blender'
		},
		macOS: {
			user: '/Users/$USER/Library/Application Support/Blender/',
			system: '/Library/Application Support/Blender/'
		},
		linux: {
			user: '$HOME/.config/blender/',
			system: '/usr/share/blender/'
		}
	}
	let result = null
	if (process.platform === 'win32') {
		result = locations.win32
	}
	if (process.platform === 'darwin') {
		result = locations.darwin
	}

	return result || locations.linux
}

BlenderLocation.prototype.resolveLocations = (locations, version) => {
	const resolvedLocations = {}

	Object.keys(locations).forEach((key) => {
		const value = locations[key]

		// Replace $USER with the actual username
		const resolvedValue = value.replace('$USER', process.env.USER)

		// Replace $HOME with the actual home directory on Linux
		const resolvedValueWithHome = resolvedValue.replace('$HOME', os.homedir())

		// Replace %USERPROFILE% with the actual user profile directory on Windows
		const userProfile = process.env.USERPROFILE || process.env.HOME
		const resolvedValueWithUserProfile = resolvedValueWithHome.replace('%USERPROFILE%', userProfile)

		// Resolve the path to its absolute path
		resolvedLocations[key] = path.join(path.resolve(resolvedValueWithUserProfile), version)
	})

	return resolvedLocations
}

BlenderLocation.prototype.getBlenderExecutablePath = function() {
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
		result = '/Applications/Blender/blender.app/Contents/MacOS/blender'
		if (!fs.existsSync(result)) {
			result = spawnSync('which', ['blender']).stdout.toString().trim()
		}
		break
	case 'linux':
		result = '/usr/share/blender'
		if (!fs.existsSync(result)) {
			result = path.join(process.env.HOME, 'software', 'blender', 'blender')
			if (!fs.existsSync(result)) {
				result = '/usr/local/bin/blender'
				if (!fs.existsSync(result)) {
					result = spawnSync('which', ['blender']).stdout.toString().trim()
				}
			}
		}
		break
	default:
		throw new Error(`Unsupported platform: ${platform}`)
	}

	if (!result || !fs.existsSync(result)) {
		throw new Error(`Blender executable "${result || 'null'}" path could not be determined`)
	}

	return result
}

BlenderLocation.prototype.version = function(exe) {
	const exeVersion = spawnSync(exe, ['--version'])
	const versionString = exeVersion.stdout.toString().trim().split('\n')[0].replace('Blender ', '')
	const result = semver.parse(semver.clean(versionString))
	return result
}

BlenderLocation.prototype.find = function() {
	const exe = this.getBlenderExecutablePath()
	const version = this.version(exe)
	const locations = this.locations()
	const resolvedLocations = this.resolveLocations(locations, `${version.major}.${version.minor}`)
	const result = {
		exe,
		path: resolvedLocations,
		version
	}

	return result
}

module.exports = BlenderLocation