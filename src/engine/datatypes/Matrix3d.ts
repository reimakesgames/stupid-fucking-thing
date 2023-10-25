import { Vector3 } from "./Vector3"

type Matrix3x3 = [
	[number, number, number],
	[number, number, number],
	[number, number, number]
]
type Range = 0 | 1 | 2

/**
 * A 3x3 matrix that can be used to represent rotations and transformations in 3D space.
 *
 * Hosts methods relating to matrix operations which can be used to transform vectors.
 *
 * See also: [[Transform]]
 */
export class Matrix3d {
	/**
	 * Creates a new matrix from the given 3x3 matrix.
	 *
	 * This is how the matrix looks like:
	 * ```ts
	 * [
	 * 	[a, b, c],
	 * 	[d, e, f],
	 * 	[g, h, i],
	 * ]
	 */
	constructor(
		readonly matrix: Matrix3x3 = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1],
		]
	) {}

	private cachedRightVector?: Vector3
	/**
	 * The right vector of the matrix, or the Positive X axis.
	 */
	get rightVector(): Vector3 {
		// cached for performance
		// do not compute at creation or an endless loop will occur
		// if we make the right vector already made when creating the matrix,
		// it will generate its internal properties over and over again.
		if (!this.cachedRightVector) {
			this.cachedRightVector = new Vector3(
				this.matrix[0][0],
				this.matrix[1][0],
				this.matrix[2][0]
			)
		}
		return this.cachedRightVector
	}

	private cachedUpVector?: Vector3
	/**
	 * The up vector of the matrix.
	 */
	get upVector(): Vector3 {
		// cached for performance
		if (!this.cachedUpVector) {
			this.cachedUpVector = new Vector3(
				this.matrix[0][1],
				this.matrix[1][1],
				this.matrix[2][1]
			)
		}
		return this.cachedUpVector
	}

	private cachedLookVector?: Vector3
	/**
	 * The look vector of the matrix. Opposite of the forward vector.
	 */
	get lookVector(): Vector3 {
		if (!this.cachedLookVector) {
			this.cachedLookVector = new Vector3(
				-this.matrix[0][2],
				-this.matrix[1][2],
				-this.matrix[2][2]
			)
		}
		return this.cachedLookVector
	}

	private cachedDeterminant?: number
	/**
	 * Calculates the determinant of the matrix.
	 */
	determinant(): number {
		if (!this.cachedDeterminant) {
			const [a, b, c] = this.matrix[0]
			const [d, e, f] = this.matrix[1]
			const [g, h, i] = this.matrix[2]

			this.cachedDeterminant =
				a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
		}
		return this.cachedDeterminant
	}

	/**
	 * Multiplies the matrix by another matrix, vector, or scalar.
	 */
	multiply(other: Matrix3d): Matrix3d
	multiply(other: Vector3): Vector3
	multiply(scalar: number): Matrix3d
	multiply(other: Matrix3d | Vector3 | Number): Matrix3d | Vector3 {
		if (other instanceof Vector3) {
			return this.vectorToObjectSpace(other)
		} else if (other instanceof Matrix3d) {
			// aj + bm + cp, ak + bn + cq, al + bo + cr
			// dj + em + fp, dk + en + fq, dl + eo + fr
			// gj + hm + ip, gk + hn + iq, gl + ho + ir

			const matrix: Matrix3x3 = [
				[0, 0, 0],
				[0, 0, 0],
				[0, 0, 0],
			]

			for (let i = 0 as Range; i < 3; i++) {
				for (let j = 0 as Range; j < 3; j++) {
					matrix[i][j] =
						this.matrix[i][0] * other.matrix[0][j] +
						this.matrix[i][1] * other.matrix[1][j] +
						this.matrix[i][2] * other.matrix[2][j]
				}
			}

			return new Matrix3d(matrix)
		} else if (typeof other === "number") {
			const matrix: Matrix3x3 = [
				[0, 0, 0],
				[0, 0, 0],
				[0, 0, 0],
			]

			for (let i = 0 as Range; i < 3; i++) {
				for (let j = 0 as Range; j < 3; j++) {
					matrix[i][j] = this.matrix[i][j] * other
				}
			}

			return new Matrix3d(matrix)
		} else {
			throw new Error("Invalid type")
		}
	}

	// i can do these because if you're getting the inverse of an inverse,
	// maybe there's something wrong with your code.
	private cachedInverse?: Matrix3d
	/**
	 * Calculates the inverse of the matrix.
	 */
	inverse(): Matrix3d {
		if (!this.cachedInverse) {
			const [a, b, c] = this.matrix[0]
			const [d, e, f] = this.matrix[1]
			const [g, h, i] = this.matrix[2]

			const det =
				a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)

			// sexy optimization brought the time taken by a whopping 50% !!! holy hell
			// append; it takes a while but subsequent calls are literally instant

			// consolidates the following operations
			// getting the adjugate matrix
			// dividing each element by the determinant
			this.cachedInverse = new Matrix3d([
				[
					(e * i - f * h) / det,
					-(b * i - c * h) / det,
					(b * f - c * e) / det,
				],
				[
					-(d * i - f * g) / det,
					(a * i - c * g) / det,
					-(a * f - c * d) / det,
				],
				[
					(d * h - e * g) / det,
					-(a * h - b * g) / det,
					(a * e - b * d) / det,
				],
			])
		}
		return this.cachedInverse
	}

	/**
	 * Transforms a vector from world space to object space.
	 *
	 * In other words, it returns the vector relative to the matrix.
	 */
	vectorToObjectSpace(vector: Vector3): Vector3 {
		const matrix = this.matrix
		const x =
			matrix[0][0] * vector.x +
			matrix[0][1] * vector.y +
			matrix[0][2] * vector.z
		const y =
			matrix[1][0] * vector.x +
			matrix[1][1] * vector.y +
			matrix[1][2] * vector.z
		const z =
			matrix[2][0] * vector.x +
			matrix[2][1] * vector.y +
			matrix[2][2] * vector.z
		return new Vector3(x, y, z)
	}

	/**
	 * Generates a rotation matrix from the given angles in radians.
	 *
	 * The order of the rotations is X, Y, Z.
	 */
	static angles(x: number, y: number, z: number): Matrix3d {
		const xMatrix = new Matrix3d([
			[1, 0, 0],
			[0, Math.cos(x), -Math.sin(x)],
			[0, Math.sin(x), Math.cos(x)],
		])
		const yMatrix = new Matrix3d([
			[Math.cos(y), 0, Math.sin(y)],
			[0, 1, 0],
			[-Math.sin(y), 0, Math.cos(y)],
		])
		const zMatrix = new Matrix3d([
			[Math.cos(z), -Math.sin(z), 0],
			[Math.sin(z), Math.cos(z), 0],
			[0, 0, 1],
		])

		return zMatrix.multiply(yMatrix).multiply(xMatrix)
	}

	/**
	 * Generates a rotation matrix from the `position` and `target` vectors where
	 * the `up` vector is used to determine the orientation of the matrix.
	 */
	static lookAt(
		position: Vector3,
		target: Vector3,
		up: Vector3 = new Vector3(0, 1, 0)
	): Matrix3d {
		const forward = position.subtract(target).unit
		const right = forward.cross(up).unit
		const up2 = right.cross(forward).unit

		return new Matrix3d([
			[right.x, up2.x, -forward.x],
			[right.y, up2.y, -forward.y],
			[right.z, up2.z, -forward.z],
		])
	}

	/**
	 * Returns the default identity matrix.
	 */
	static readonly IDENTITY = new Matrix3d()
}
