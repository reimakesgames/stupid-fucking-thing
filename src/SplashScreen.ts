import Settings from "./Settings.js"
import Preloader from "./engine/modules/Preloader.js"

const UserActivation: any = (navigator as any).userActivation
const Duration = 300
const FadeDuration = 700
let Timer: number
let Callback: Function

// TODO: replace callback with an event instead of a function, so that many things can listen to it if needed

function SplashScreen(context: CanvasRenderingContext2D, callback?: Function) {
	if (Timer) {
		if (performance.now() - Timer > Duration) {
			context.globalAlpha =
				1 - (performance.now() - Timer - Duration) / FadeDuration
		}
	}

	if (callback) {
		Callback = callback
	}

	context.clearRect(0, 0, Settings.SCREEN_SIZE_X, Settings.SCREEN_SIZE_Y)

	context.fillStyle = "#17171F"
	context.fillRect(0, 0, Settings.SCREEN_SIZE_X, Settings.SCREEN_SIZE_Y)

	context.fillStyle = "#FFFFFF"
	context.font = "100 36px Ubuntu"
	context.textAlign = "center"
	context.textBaseline = "bottom"
	context.fillText(
		"REIGNITE",
		Settings.SCREEN_SIZE_X / 2,
		Settings.SCREEN_SIZE_Y / 2
	)

	context.font = "200 12px Ubuntu"
	context.textBaseline = "top"
	context.fillText(
		"A TypeScript Game Engine by Rei",
		Settings.SCREEN_SIZE_X / 2,
		Settings.SCREEN_SIZE_Y / 2 + 4
	)

	if (!UserActivation.hasBeenActive) {
		context.font = "200 16px Ubuntu"
		context.textBaseline = "bottom"
		context.fillText(
			"Interact with the window to continue",
			Settings.SCREEN_SIZE_X / 2,
			Settings.SCREEN_SIZE_Y - 4
		)
	}

	context.strokeStyle = "#FFFFFF"
	context.beginPath()
	context.moveTo(
		Settings.SCREEN_SIZE_X / 2 - 120,
		Settings.SCREEN_SIZE_Y / 2 - 0.5
	)
	context.lineTo(
		Settings.SCREEN_SIZE_X / 2 + 120,
		Settings.SCREEN_SIZE_Y / 2 - 0.5
	)
	context.stroke()

	// draw pi chart of preloader progress
	context.fillStyle = "#FFFFFF"
	context.beginPath()
	context.arc(
		Settings.SCREEN_SIZE_X - 24,
		Settings.SCREEN_SIZE_Y - 24,
		16,
		-90 * (Math.PI / 180),
		(-90 + (Preloader.Progress / Preloader.Total) * 360) * (Math.PI / 180)
	)
	context.lineTo(Settings.SCREEN_SIZE_X - 24, Settings.SCREEN_SIZE_Y - 24)
	context.closePath()
	context.fill()

	// continually request animation frames for the splash screen
	if (Settings.ENABLE_SPLASH_SCREEN) {
		// cancel after timer has expired, assets have loaded, and user has interacted with the window
		if (!Timer && UserActivation.hasBeenActive && Preloader.Active) {
			Timer = performance.now()
		}
		// then run the callback and exit
		if (performance.now() - Timer > Duration + FadeDuration) {
			Callback?.()
			return
		}
		requestAnimationFrame(() => SplashScreen(context))
	}
}

export default SplashScreen
