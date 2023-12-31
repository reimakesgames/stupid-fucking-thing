import { app, BrowserWindow, session, ipcMain } from "electron"
import * as path from "path"
const __dirname = path.resolve()
import { Settings } from "./Settings"

const FRAME_ENABLED = true
const TITLEBAR_ENABLED = true
const RESCALABLE = false

const WINDOW_MARGIN = FRAME_ENABLED ? 6 : 0
const TITLEBAR_HEIGHT = RESCALABLE ? 29 : 23
const WINDOWS_TITLE_BAR_HEIGHT = TITLEBAR_ENABLED ? TITLEBAR_HEIGHT : 0

const createWindow = () => {
	const win = new BrowserWindow({
		width: Settings.screenSizeX + WINDOW_MARGIN,
		height: Settings.screenSizeY + WINDOW_MARGIN + WINDOWS_TITLE_BAR_HEIGHT,
		minWidth: Settings.screenSizeX + WINDOW_MARGIN,
		minHeight:
			Settings.screenSizeY + WINDOW_MARGIN + WINDOWS_TITLE_BAR_HEIGHT,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
		titleBarStyle: TITLEBAR_ENABLED ? "hiddenInset" : "hidden",
		frame: FRAME_ENABLED,
		title: "ReigniteTS",
	})
	win.setMenuBarVisibility(false)
	win.setResizable(RESCALABLE)

	win.loadFile("game.html")

	ipcMain.on("setWindowTitle", (event, title) => {
		win.setTitle(title)
	})
}

app.whenReady().then(() => {
	createWindow()

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})

	// make COOP same-origin, and COEP require-corp
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				"Cross-Origin-Opener-Policy": "same-origin",
				"Cross-Origin-Embedder-Policy": "require-corp",
			},
		})
	})
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit()
})
