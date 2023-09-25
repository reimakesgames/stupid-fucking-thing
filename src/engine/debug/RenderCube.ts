import Camera from "../classes/Camera.js"
import Matrix3 from "../datatypes/Matrix3.js"
import Vector3 from "../datatypes/Vector3.js"
import Projector from "../modules/Projector.js"
import SkewedImage, { Point } from "../modules/Texturer.js"
import Profiler from "./Profiler.js"

const texture = new Image()
// texture.src =
// 	"https://media.discordapp.net/stickers/1098863054369865868.png?size=160"
texture.src = "./assets/normal.png"

const cubeVertices = [
	new Vector3(-1, -1, -1),
	new Vector3(-1, -1, 1),
	new Vector3(-1, 1, -1),
	new Vector3(-1, 1, 1),
	new Vector3(1, -1, -1),
	new Vector3(1, -1, 1),
	new Vector3(1, 1, -1),
	new Vector3(1, 1, 1),
]

const cubeFaces = [
	[0, 1, 3, 2],
	[4, 5, 7, 6],
	[0, 1, 5, 4],
	[2, 3, 7, 6],
	[0, 2, 6, 4],
	[1, 3, 7, 5],
]

const cubeFacesColor = [
	"ff0000",
	"ffff00",
	"00ff00",
	"ff00ff",
	"00ffff",
	"0000ff",
]

export default function RenderCube(
	context: CanvasRenderingContext2D,
	camera: Camera
) {
	Profiler.Begin("Draw Cube")

	Profiler.Begin("Rotate Cube")
	const cubeRotation = new Vector3(
		performance.now() / 1000,
		performance.now() / 1000,
		performance.now() / 1000
	)

	const cubeRotationMatrix = new Matrix3([
		[Math.cos(cubeRotation.Z), -Math.sin(cubeRotation.Z), 0],
		[Math.sin(cubeRotation.Z), Math.cos(cubeRotation.Z), 0],
		[0, 0, 1],
	])
		.Multiply(
			new Matrix3([
				[Math.cos(cubeRotation.Y), 0, Math.sin(cubeRotation.Y)],
				[0, 1, 0],
				[-Math.sin(cubeRotation.Y), 0, Math.cos(cubeRotation.Y)],
			])
		)
		.Multiply(
			new Matrix3([
				[1, 0, 0],
				[0, Math.cos(cubeRotation.X), -Math.sin(cubeRotation.X)],
				[0, Math.sin(cubeRotation.X), Math.cos(cubeRotation.X)],
			])
		)

	let cubeRotatedVertices = cubeVertices.map((vertex) => {
		return cubeRotationMatrix.Multiply(vertex) as Vector3
	})
	cubeRotatedVertices = cubeRotatedVertices.map((vertex) => {
		return vertex.Add(
			new Vector3(
				Math.sin(performance.now() / 1000) * 4,
				Math.cos(performance.now() / 1000) * 4,
				0
			)
		)
	})
	Profiler.End()

	Profiler.Begin("Project Cube")
	const cubeProjectedVertices = cubeRotatedVertices.map((vertex) => {
		return Projector(vertex, camera)
	})
	Profiler.End()

	Profiler.Begin("Sort Cube Faces")
	const sortedDrawOrder = cubeFaces
		.map((face, index) => {
			// get average distance of each face
			const faceVertices = cubeFaces[index]
			const faceProjectedVertices = faceVertices?.map((vertex) => {
				return cubeProjectedVertices[vertex]
			}) as Vector3[]
			const faceDistance =
				faceProjectedVertices.reduce((acc, vertex) => {
					return acc + vertex.Z
				}, 0) / faceProjectedVertices?.length
			return {
				index: index,
				distance: faceDistance,
			}
		})
		.sort((a, b) => {
			return b.distance - a.distance
		})
	Profiler.End()

	Profiler.Begin("Draw Cube Faces")
	sortedDrawOrder.forEach((face) => {
		const faceVertices = cubeFaces[face.index]
		const faceColor = cubeFacesColor[face.index]
		const faceProjectedVertices = faceVertices?.map((vertex) => {
			return cubeProjectedVertices[vertex]
		}) as Vector3[]

		context.fillStyle = `#${faceColor}`
		context.beginPath()
		context.moveTo(
			faceProjectedVertices[0]?.X || 0,
			faceProjectedVertices[0]?.Y || 0
		)
		faceProjectedVertices.forEach((vertex) => {
			context.lineTo(vertex.X, vertex.Y)
		})
		context.closePath()
		context.fill()

		let image = new SkewedImage(texture)
		image.p1 = new Point(
			faceProjectedVertices[0]?.X,
			faceProjectedVertices[0]?.Y
		)
		image.p2 = new Point(
			faceProjectedVertices[1]?.X,
			faceProjectedVertices[1]?.Y
		)
		image.p3 = new Point(
			faceProjectedVertices[2]?.X,
			faceProjectedVertices[2]?.Y
		)
		image.p4 = new Point(
			faceProjectedVertices[3]?.X,
			faceProjectedVertices[3]?.Y
		)
		image.context = context
		image.Draw()
	})
	Profiler.End()

	Profiler.End()
}