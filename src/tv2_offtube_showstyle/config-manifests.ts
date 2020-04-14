import { ConfigManifestEntry, ConfigManifestEntryType } from 'tv-automation-sofie-blueprints-integration'

export const showStyleConfigManifest: ConfigManifestEntry[] = [
	{
		id: 'CasparCGLoadingClip',
		name: 'CasparCG Loading Clip',
		description: 'Clip to play when media is loading',
		type: ConfigManifestEntryType.STRING,
		defaultVal: 'LoadingLoop',
		required: true
	},
	{
		id: 'DVEStyles',
		name: 'DVE Layouts',
		description: '',
		type: ConfigManifestEntryType.TABLE,
		required: false,
		defaultVal: [
			{
				_id: '',
				DVEName: '',
				DVEInputs: '',
				DVEJSON: '{}',
				DVEGraphicsTemplate: '',
				DVEGraphicsTemplateJSON: '{}',
				DVEGraphicsKey: '',
				DVEGraphicsFrame: ''
			}
		],
		columns: [
			{
				id: 'DVEName',
				name: 'DVE name',
				description: 'The name as it will appear in iNews',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 0
			},
			{
				id: 'DVEInputs',
				name: 'Box inputs',
				description: 'I.e.: 1:INP1;2:INP3; as an example to chose which ATEM boxes to assign iNews inputs to',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '1:INP1;2:INP2;3:INP3;4:INP4',
				rank: 1
			},
			{
				id: 'DVEJSON',
				name: 'DVE config',
				description: 'DVE config pulled from ATEM',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 2
			},
			{
				id: 'DVEGraphicsTemplate',
				name: 'CasparCG template',
				description: 'File name (path) for CasparCG overlay template (locators)',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: 'dve/locators',
				rank: 3
			},
			{
				id: 'DVEGraphicsTemplateJSON',
				name: 'CasparCG template config',
				description: 'Position (and style) data for the boxes in the CasparCG template',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 4
			},
			{
				id: 'DVEGraphicsKey',
				name: 'CasparCG key file',
				description: 'Key file for DVE',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 5
			},
			{
				id: 'DVEGraphicsFrame',
				name: 'CasparCG frame file',
				description: 'Frames file for caspar',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 6
			}
		]
	},
	{
		/*
		Graphic template setup								
		Grafik template (viz)	
		Source layer
		Layer mapping
		inews code	
		inews name	
		destination	default out (default, S, B, O)	
		var 1 name	
		var 2 name 	
		note
		*/
		id: 'GFXTemplates',
		name: 'GFX Templates',
		description:
			'This table can contain info in two ways. Things marked (**) are always required. If you want to do the mapping from iNews-code, then all (*)-elements are aslo required. VizTemplate is what the graphic is called in viz. Source layer is the ID of the Sofie Source layer in the UI (i.e. "studio0_graphicsTema"). Layer mapping is the Sofie studio layer mapping (i.e "viz_layer_tema").  iNews command can be something like "KG=", then iNews Name is the thing that follows in iNes i.e. "ident_nyhederne"',
		type: ConfigManifestEntryType.TABLE,
		required: false,
		defaultVal: [
			{
				_id: '',
				VizTemplate: '',
				SourceLayer: '',
				LayerMapping: '',
				INewsCode: '',
				INewsName: '',
				VizDestination: '',
				OutType: '', // (default(''), S, B, O)
				Argument1: '',
				Argument2: '',
				IsDesign: false
			}
		],
		columns: [
			{
				id: 'VizTemplate',
				name: 'Viz Template Name (**)',
				description: 'The name of the Viz Template',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 0
			},
			{
				id: 'SourceLayer',
				name: 'Source layer (**)',
				description: 'The ID of the source layer to place the piece on in Sofie UI',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 1
			},
			{
				id: 'LayerMapping',
				name: 'Layer mapping (**)',
				description:
					'The Sofie Layer mapping to use in playback. This will ensure proper viz transition logic by matching the viz layers.',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 2
			},
			{
				id: 'INewsCode',
				name: 'iNews Command (*)',
				description: 'The code as it will appear in iNews',
				type: ConfigManifestEntryType.STRING,
				required: false,
				defaultVal: '',
				rank: 3
			},
			{
				id: 'INewsName',
				name: 'iNews Name (*)',
				description: 'The name after the code',
				type: ConfigManifestEntryType.STRING,
				required: false,
				defaultVal: '',
				rank: 4
			},
			{
				id: 'VizDestination',
				name: 'Viz Destination (*)',
				description: 'The name of the Viz Engine',
				type: ConfigManifestEntryType.STRING,
				required: false,
				defaultVal: '',
				rank: 5
			},
			{
				id: 'OutType',
				name: 'Out type',
				description: 'The type of out, none follow timecode, S stays on to ??, B stays on to ??, O stays on to ??',
				type: ConfigManifestEntryType.STRING,
				required: false,
				defaultVal: '',
				rank: 6
			},
			{
				id: 'Argument1',
				name: 'Variable 1',
				description: 'Argument passed to Viz',
				type: ConfigManifestEntryType.STRING,
				required: false,
				defaultVal: '',
				rank: 7
			},
			{
				id: 'Argument2',
				name: 'Variable 2',
				description: 'Argument passed to Viz',
				type: ConfigManifestEntryType.STRING,
				required: false,
				defaultVal: '',
				rank: 8
			},
			{
				id: 'IsDesign',
				name: 'Changes Design',
				description: 'Whether this cue changes the design',
				type: ConfigManifestEntryType.BOOLEAN,
				required: false,
				defaultVal: false,
				rank: 9
			}
		]
	},
	{
		/*
		Wipes Config
		Effekt number
		Clip name
		Alpha at start
		Alpha at end
		*/
		id: 'WipesConfig',
		name: 'Wipes Configuration',
		description: 'Wipes effekts configuration',
		type: ConfigManifestEntryType.TABLE,
		required: false,
		defaultVal: [
			{
				_id: '',
				EffektNumber: 0,
				ClipName: '',
				Duration: 0,
				StartAlpha: 0,
				EndAlpha: 0
			}
		],
		columns: [
			{
				id: 'EffektNumber',
				name: 'Effekt Number',
				description: 'The Effect Number',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 0,
				rank: 0
			},
			{
				id: 'ClipName',
				name: 'Clip Name',
				description: 'The name of the wipe clip',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 1
			},
			{
				id: 'Duration',
				name: 'Effekt Duration',
				description: 'Duration of the effekt',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 0,
				rank: 2
			},
			{
				id: 'StartAlpha',
				name: 'Alpha at Start',
				description: 'Number of frames of alpha at start',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 0,
				rank: 3
			},
			{
				id: 'EndAlpha',
				name: 'Alpha at End',
				description: 'Number of frames of alpha at end',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 0,
				rank: 4
			}
		]
	},
	{
		/*
		Breaker Config
		Effekt number
		Clip name
		Alpha at start
		Alpha at end
		*/
		id: 'BreakerConfig',
		name: 'Breaker Configuration',
		description:
			'Clip name is the clip name without file extension. Duration is the length of the file, including trailing audio. Alpha start is the number of frames from the first frame and until the jingle covers the full frame. The alpha end is how many frames from the alpha starts fading out, until the very end of the file.',
		type: ConfigManifestEntryType.TABLE,
		required: false,
		defaultVal: [
			{
				_id: '',
				BreakerName: '',
				ClipName: '',
				Duration: 0,
				StartAlpha: 0,
				EndAlpha: 0,
				Autonext: true
			}
		],
		columns: [
			{
				id: 'BreakerName',
				name: 'Breaker name',
				description: 'Breaker name as typed in iNews',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 0
			},
			{
				id: 'ClipName',
				name: 'Clip Name',
				description: 'The name of the breaker clip to play',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 1
			},
			{
				id: 'Duration',
				name: 'Effekt Duration',
				description: 'Duration of the effekt',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 0,
				rank: 2
			},
			{
				id: 'StartAlpha',
				name: 'Alpha at Start',
				description: 'Number of frames of alpha at start',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 0,
				rank: 3
			},
			{
				id: 'EndAlpha',
				name: 'Alpha at End',
				description: 'Number of frames of alpha at end',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 0,
				rank: 4
			},
			{
				id: 'Autonext',
				name: 'Autonext',
				description: '',
				type: ConfigManifestEntryType.BOOLEAN,
				required: true,
				defaultVal: true,
				rank: 5
			}
		]
	},
	{
		id: 'DefaultTemplateDuration',
		name: 'Default Template Duration',
		description: 'Default Template Duration',
		type: ConfigManifestEntryType.NUMBER,
		required: true,
		defaultVal: 4
	},
	{
		/*
		LYD Mappings
		iNews Name
		File Name
		*/
		id: 'LYDConfig',
		name: 'LYD Config',
		description: 'Map LYD iNews names to file names',
		type: ConfigManifestEntryType.TABLE,
		required: false,
		defaultVal: [
			{
				_id: '',
				INewsName: '',
				FileName: ''
			}
		],
		columns: [
			{
				id: 'INewsName',
				name: 'iNews Name',
				description: 'Name of LYD as in iNews',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 0
			},
			{
				id: 'FileName',
				name: 'File Name',
				description: 'The name of the LYD file',
				type: ConfigManifestEntryType.STRING,
				required: true,
				defaultVal: '',
				rank: 1
			},
			{
				id: 'FadeIn',
				name: 'Fade In',
				description: 'ms duration to fade in file',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 1000,
				rank: 2
			},
			{
				id: 'FadeOut',
				name: 'Fade Out',
				description: 'ms duration to fade out file',
				type: ConfigManifestEntryType.NUMBER,
				required: true,
				defaultVal: 1000,
				rank: 3
			}
		]
	}
]
