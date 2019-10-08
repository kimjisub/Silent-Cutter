module.exports.getOptFunc = (methodIndex) => {
	let list = [
		optimizeFunction0,
		optimizeFunction1,
		optimizeFunction2,
		optimizeFunction3
	]
	return list[methodIndex] || optimizeFunction0
}

module.exports.roundList = (input, size, method) => {
	let output = []
	for (let i = 0; i < input.length; i++) {
		let start = Math.max(i - size, 0)
		let end = Math.min(i + size, input.length - 1)
		let length = end - start + 1

		let maxTotal = 0
		for (let j = start; j <= end; j++) {
			let weight = (j - i) / size || 0
			maxTotal += optimizeValue(1, weight, method)
		}
		let maxAvg = maxTotal / length

		let total = 0
		for (let j = start; j <= end; j++) {
			let weight = (j - i) / size || 0
			total += optimizeValue(input[j], weight, method)
		}
		let avg = total / length * (1 / maxAvg)

		output[i] = avg
	}
	return output
}

const optimizeValue = (value, weight, method) => {
	return value * method(weight)
}

const optimizeFunction0 = (x) => {
	return 1
}

const optimizeFunction1 = (x) => {
	return (1 - Math.pow(x, 2))
}

const optimizeFunction2 = (x) => {
	if (x < 0)
		return Math.sqrt(1 - Math.pow(x, 2))
	else
		return (x + 1) * Math.pow((x - 1), 6)
}

const optimizeFunction3 = (x) => {
	if (x < 0)
		return Math.sqrt(1 - Math.pow(x, 2)) * (1 / 3 * x + 1)
	else if (x < 0.9)
		return (x + 1) * Math.pow((x - 1), 4)
	else
		return 3
}