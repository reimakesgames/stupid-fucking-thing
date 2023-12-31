import { Logger } from "../debug/Logger"
import { Settings } from "../Settings"

const log = new Logger("Preloader")

const ALLOWED_IMG_FORMATS = ["jpg", "jpeg", "png"] as const
const ALLOWED_AUDIO_FORMATS = ["mp3", "ogg", "wav"] as const

var cacheStorage: (HTMLImageElement | HTMLAudioElement)[] = []
// give the reference to the window object to actually cache the assets
;(window as any).__Preloader_CacheStorage = cacheStorage
// yes, i know. but fighting against the minifier/trimmer took too much time
// for me to figure out, too bad!

type URL = string
type AllowedImageFormat = (typeof ALLOWED_IMG_FORMATS)[number]
type AllowedAudioFormat = (typeof ALLOWED_AUDIO_FORMATS)[number]
type Asset = AllowedAudioFormat | AllowedImageFormat

function spawnGreenThread<T>(func: () => T) {
	return new Promise<T>((resolve, reject) => {
		setTimeout(() => {
			try {
				resolve(func())
			} catch (e) {
				reject(e)
			}
		}, 0)
	})
}

function loadAsset(url: URL) {
	let ext = url.split(".").pop() as Asset
	if (ALLOWED_IMG_FORMATS.includes(ext as AllowedImageFormat)) {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			let img = new Image()
			img.onload = () => {
				cacheStorage.push(img)
				resolve(img)
			}
			img.onerror = () => reject()
			img.src = url
		})
	} else if (ALLOWED_AUDIO_FORMATS.includes(ext as AllowedAudioFormat)) {
		return new Promise<HTMLAudioElement>((resolve, reject) => {
			let audio = new Audio()
			audio.oncanplaythrough = () => {
				cacheStorage.push(audio)
				resolve(audio)
			}
			audio.onerror = () => reject()
			audio.src = url
		})
	} else {
		throw new Error(`Unsupported asset format: ${ext}`)
	}
}

function sanitizeAssetArray(array: URL[]) {
	// remove duplicates, and remove assets that are not supported while emitting a warning
	let sanitizedArray: URL[] = []
	for (let url of array) {
		let ext = url.split(".").pop() as Asset
		if (ALLOWED_IMG_FORMATS.includes(ext as AllowedImageFormat)) {
			if (!sanitizedArray.includes(url)) {
				sanitizedArray.push(url)
			}
		} else if (ALLOWED_AUDIO_FORMATS.includes(ext as AllowedAudioFormat)) {
			if (!sanitizedArray.includes(url)) {
				sanitizedArray.push(url)
			}
		} else {
			log.warn(`Unsupported asset format: ${ext}`)
		}
	}
	return sanitizedArray
}

/**
 * Preloads assets prior to the game starting.
 *
 * Uses green threads to load assets in parallel.
 * Shouldn't negatively impact performance, but will increase load times.
 */
export class Preloader {
	static progress = 0
	static total = 0
	static active = false
	private static activeThreads = 0

	static preloadAssets(array: URL[]) {
		array = sanitizeAssetArray(array)
		this.active = false
		this.progress = 0
		this.total = array.length
		const unlimitedThreads = Settings.preloaderThreads == 0
		const threadsToSpawn = unlimitedThreads
			? array.length
			: Settings.preloaderThreads
		for (let i = 0; i < threadsToSpawn; i++) {
			if (!unlimitedThreads) {
				log.warn(
					`Spawning thread ${
						i + 1
					} of ${threadsToSpawn} for preloading.`
				)
			}
			this.activeThreads++
			spawnGreenThread(async () => {
				while (array.length > 0) {
					let url = array.pop() as URL
					try {
						await loadAsset(url)
						log.log(`Loaded asset ${url}`)
					} catch (e) {
						log.error(`Failed to load asset ${url}. ${e}`)
					}
					this.progress = this.progress + 1
				}
				this.activeThreads--
				if (this.activeThreads == 0) {
					this.active = true
					log.log("Preloading complete.")
				}
			})
		}
	}
}
