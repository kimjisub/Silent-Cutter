const plot = require('nodeplotlib')

let volume = []
let roundedVolume = []
let sounded = []
let roundingSounded = []
let roundedSounded = []
let standardDb = 0
let optionString = 'Report<br>'

const plotData = [{
		type: 'bar',
		mode: 'lines',
		name: 'Sounded',
		y: [0, 1, 1, 0, 0, 1],
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
		y: [0, 1, 1, 0, 0, 1],
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
		y: [0, 1, 1, 0, 0, 1],
		xaxis: 'x',
		yaxis: 'y2'
	},
	{
		type: 'scatter',
		mode: 'lines',
		name: 'Volume',
		y: [-35, -57, -47, -56, -44, -54],
		xaxis: 'x',
		yaxis: 'y3'
	},
	{
		type: 'scatter',
		mode: 'lines',
		name: 'Rounded Volume',
		y: [-35, -57, -47, -56, -44, -54],
		xaxis: 'x',
		yaxis: 'y3'
	},
	{
		type: 'scatter',
		mode: 'lines',
		name: 'Standard db',
		x: [0,1000],
		y: [-50, -50],
		xaxis: 'x',
		yaxis: 'y3'
	},
]
const plotLayout = {
	title:{
		text: 'Report<br>'
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
}

function insertData() {
	plotData[0].y = sounded
	plotData[1].y = roundedSounded
	plotData[2].y = roundingSounded
	plotData[3].y = volume
	plotData[4].y = roundedVolume
	plotData[5].x = [0, sounded.length]
	plotData[5].y = [standardDb, standardDb]
	plotLayout.title.text = optionString
}

module.exports.show = () => {
	insertData()
	plot.plot(plotData, plotLayout)
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