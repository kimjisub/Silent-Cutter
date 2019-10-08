const plot = require('nodeplotlib')

let volume = []
let roundedVolume = []
let sounded = []
let roundingSounded = []
let roundedSounded = []

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
]
const plotLayout = {
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
			text: 'asdf'
		}
	},
	yaxis2: {
		side: 'right',
		overlaying: 'y',
		range: [0, 1],
		title: {
			text: 'asdf'
		}
	},
	yaxis3: {
		side: 'left',
		overlaying: 'y',
		//range:[0,1],
		title: {
			text: 'asdf'
		}
	}
}

function insertData() {
	plotData[0].y = sounded
	plotData[1].y = roundingSounded
	plotData[2].y = roundedSounded
	plotData[3].y = volume
	plotData[4].y = roundedVolume
}

module.exports.show = () => {
	plot.plot(plotData, plotLayout)
}

module.exports.addVolume = (data) => {
	volume = data
	insertData()
}

module.exports.addRoundedVolume = (data) => {
	roundedVolume = data
	insertData()
}

module.exports.addSounded = (data) => {
	sounded = data
	insertData()
}

module.exports.addRoundingSounded = (data) => {
	roundingSounded = data
	insertData()
}

module.exports.addRoundedSounded = (data) => {
	roundedSounded = data
	insertData()
}