const plot = require('nodeplotlib')

let volume = []
let roundedVolume = []
let sounded = []
let roundingSounded = []
let roundedSounded = []
let standardDb = 0
let optionString = 'Report<br>'

let optimizeFunction = () => 1


module.exports.show = () => {
	plot.stack(
		[{
				type: 'bar',
				mode: 'lines',
				name: 'Sounded',
				y: sounded,
				xaxis: 'x',
				yaxis: 'y1',
				width: 1,
				marker: {
					color: '#EF285Eaa'
				}
			},
			{
				type: 'bar',
				mode: 'lines',
				name: 'Rounded Sounded',
				y: roundedSounded,
				xaxis: 'x',
				yaxis: 'y2',
				width: 1,
				marker: {
					color: '#F09D25aa'
				}
			},
			{
				type: 'scatter',
				mode: 'lines',
				name: 'Rounding Sounded',
				y: roundingSounded,
				xaxis: 'x',
				yaxis: 'y2'
			},
			{
				type: 'scatter',
				mode: 'lines',
				name: 'Volume',
				y: volume,
				xaxis: 'x',
				yaxis: 'y3'
			},
			{
				type: 'scatter',
				mode: 'lines',
				name: 'Rounded Volume',
				y: roundedVolume,
				xaxis: 'x',
				yaxis: 'y3'
			},
			{
				type: 'scatter',
				mode: 'lines',
				name: 'Standard db',
				x: [0, sounded.length],
				y: [standardDb, standardDb],
				xaxis: 'x',
				yaxis: 'y3'
			},
		], {
			title: {
				text: optionString
			},
			xaxis: {
				side: 'bottom',
				//range:[0,1],
				title: {
					text: 'Time'
				}
			},
			yaxis1: {
				side: 'right',
				range: [0, 1],
				title: {
					text: 'Sounded'
				}
			},
			yaxis2: {
				side: 'right',
				overlaying: 'y',
				range: [0, 1],
			},
			yaxis3: {
				side: 'left',
				overlaying: 'y',
				//range:[0,1],
				title: {
					text: 'Volume (dB)'
				}
			}
		})


	const scale = 100
	let xList = []
	let yList = []
	for(let i=-scale;i<=scale;i++){
		let x = i / scale
		let y = optimizeFunction(x)
		xList.push(x)
		yList.push(y)
	}
	
	plot.stack(
		[{
			type: 'scatter',
			mode: 'lines',
			name: 'Optimize Function',
			x: xList,
			y: yList,
			xaxis: 'x',
			yaxis: 'y',
			width: 1
		}], {
			autosize: false,
			width: 500,
			height: 500,
			title: {
				text: 'Optimize Function'
			},
			xaxis: {
				side: 'bottom',
				range:[-1,1],
				title: {
					text: 'Relate'
				}
			},
			yaxis: {
				side: 'left',
				range: [-1, 1],
				title: {
					text: 'Weight'
				}
			},
		})
	plot.plot()
}

module.exports.addVolume = (data) => {
	volume = data
}

module.exports.addRoundedVolume = (data) => {
	roundedVolume = data
}

module.exports.addSounded = (data) => {
	sounded = data
}

module.exports.addRoundingSounded = (data) => {
	roundingSounded = data
}

module.exports.addRoundedSounded = (data) => {
	roundedSounded = data
}

module.exports.setStandardDb = (data) => {
	standardDb = data
}

module.exports.addOptionString = (data) => {
	optionString += `<sup>${data}</sup><br>`
}

module.exports.setOptimizeFunction = (func) => {
	optimizeFunction = func
}