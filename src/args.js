const ArgumentParser = require('argparse').ArgumentParser
const parser = new ArgumentParser({
	version: '0.0.1',
	addHelp: true,
	description: 'Cut Video by Silence'
})

parser.addArgument(
	['-i'], {
		type: String,
		dest: 'input',
		metavar: 'INPUT',
		help: 'Input file. (Default: input.mp4)',
		defaultValue: 'input.mp4'
	}
)

parser.addArgument(
	['-o'], {
		type: String,
		dest: 'output',
		metavar: 'OUTPUT',
		help: 'Output file. (Default: output.mp4)',
		defaultValue: 'output.mp4'
	}
)

parser.addArgument(
	['-c'], {
		type: Number,
		dest: 'chunk_size',
		metavar: 'CHUNK_SIZE',
		help: 'Sound chunk size in sec. (Default: sec of 1 frame)',
		defaultValue: 0.03333333
	}
)

parser.addArgument(
	['-s'], {
		type: Number,
		dest: 'sounded_speed',
		metavar: 'SOUNDED_SPEED',
		help: 'Set sounded part speed. (Default: 1)',
		defaultValue: 1
	}
)

parser.addArgument(
	['-ns'], {
		type: Number,
		dest: 'silent_speed',
		metavar: 'SILENT_SPEED',
		help: 'Set silent part speed. (Default: Inf)',
		defaultValue: Infinity
	}
)

parser.addArgument(
	['-db'], {
		type: Number,
		dest: 'standard_db',
		metavar: 'STANDARD_dB',
		help: 'Set standard dB for recognition. (Default: -50)',
		defaultValue: -50
	}
)

parser.addArgument(
	['-vrr'], {
		type: Number,
		dest: 'volume_round_range',
		metavar: 'RANGE',
		help: 'Set volume round range in chunk. (Default: 3)',
		defaultValue: 3
	}
)

parser.addArgument(
	['-srr'], {
		type: Number,
		dest: 'sounded_round_range',
		metavar: 'RANGE',
		help: 'Set sounded round range in chunk. (Default: 10)',
		defaultValue: 10
	}
)

parser.addArgument(
	['-vrm'], {
		type: Number,
		dest: 'volume_round_method',
		metavar: 'METHOD',
		help: 'Set volume round method. (Default: 3)',
		defaultValue: 3,
		choices: [0,1,2,3]
	}
)

parser.addArgument(
	['-srm'], {
		type: Number,
		dest: 'sounded_round_method',
		metavar: 'METHOD',
		help: 'Set sounded round method. (Default: 1)',
		defaultValue: 1,
		choices: [0,1,2,3]
	}
)

parser.addArgument(
	['-d'], {
		type: Boolean,
		dest: 'debug',
		metavar: 'DEBUG',
		help: 'Show Debug web page. (Default: true)',
		defaultValue: true
	}
)

module.exports = () => parser.parseArgs()