import {
	ConfigManifestEntry,
	ConfigManifestEntryTable,
	ConfigManifestEntryType,
	TableConfigItemValue,
	TSR
} from '@sofie-automation/blueprints-integration'
import {
	literal,
	MakeConfigWithMediaFlow,
	TableConfigItemDSK,
	TableConfigItemSourceMapping,
	TableConfigItemSourceMappingWithSisyfos
} from 'tv2-common'
import * as _ from 'underscore'
import { AtemSourceIndex } from '../types/atem'
import { defaultDSK } from './helpers/config'
import { SisyfosLLAyer } from './layers'

export const CORE_INJECTED_KEYS = ['SofieHostURL']

const DEFAULT_STUDIO_MICS_LAYERS = [
	SisyfosLLAyer.SisyfosSourceHost_1_ST_A,
	SisyfosLLAyer.SisyfosSourceHost_2_ST_A,
	SisyfosLLAyer.SisyfosSourceGuest_1_ST_A,
	SisyfosLLAyer.SisyfosSourceGuest_2_ST_A,
	SisyfosLLAyer.SisyfosSourceGuest_3_ST_A,
	SisyfosLLAyer.SisyfosSourceGuest_4_ST_A
]

export const manifestAFVDSourcesCam: ConfigManifestEntryTable = {
	id: 'SourcesCam',
	name: 'Camera Mapping',
	description: 'Camera number to ATEM input and Sisyfos layer',
	type: ConfigManifestEntryType.TABLE,
	required: true,
	defaultVal: literal<Array<TableConfigItemSourceMappingWithSisyfos & TableConfigItemValue[0]>>([
		{
			_id: '',
			SourceName: '1',
			AtemSource: 11,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '2',
			AtemSource: 12,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '3',
			AtemSource: 13,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '4',
			AtemSource: 14,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '5',
			AtemSource: 15,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '1S',
			AtemSource: 16,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '2S',
			AtemSource: 17,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '3S',
			AtemSource: 18,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '4S',
			AtemSource: 19,
			SisyfosLayers: [],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '5S',
			AtemSource: 20,
			SisyfosLayers: [],
			StudioMics: true
		}
	]),
	columns: [
		{
			id: 'SourceName',
			name: 'Camera name',
			description: 'Camera name as typed in iNews',
			type: ConfigManifestEntryType.STRING,
			required: true,
			defaultVal: '',
			rank: 0
		},
		{
			id: 'AtemSource',
			name: 'ATEM input',
			description: 'ATEM vision mixer input for Camera',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 0,
			rank: 1
		},
		{
			id: 'SisyfosLayers',
			name: 'Sisyfos layers',
			description: 'Sisyfos layers for Camera',
			type: ConfigManifestEntryType.LAYER_MAPPINGS,
			filters: {
				deviceTypes: [TSR.DeviceType.SISYFOS]
			},
			required: true,
			multiple: true,
			defaultVal: [],
			rank: 2
		},
		{
			id: 'StudioMics',
			name: 'Use Studio Mics',
			description: 'Add Sisyfos layers for Studio Mics',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: true,
			rank: 3
		}
	]
}

export const manifestAFVDSourcesRM: ConfigManifestEntryTable = {
	id: 'SourcesRM',
	name: 'RM Mapping',
	description: 'RM number to ATEM input',
	type: ConfigManifestEntryType.TABLE,
	required: false,
	defaultVal: literal<Array<TableConfigItemSourceMappingWithSisyfos & TableConfigItemValue[0]>>([
		{
			_id: '',
			SourceName: '1',
			AtemSource: 1,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_1],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '2',
			AtemSource: 2,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_2],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '3',
			AtemSource: 3,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_3],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '4',
			AtemSource: 4,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_4],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '5',
			AtemSource: 5,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_5],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '6',
			AtemSource: 6,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_6],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '7',
			AtemSource: 7,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_7],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '8',
			AtemSource: 8,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_8],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '9',
			AtemSource: 9,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_9],
			StudioMics: false,
			KeepAudioInStudio: true
		},
		{
			_id: '',
			SourceName: '10',
			AtemSource: 10,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_10],
			StudioMics: false,
			KeepAudioInStudio: true
		}
	]),
	columns: [
		{
			id: 'SourceName',
			name: 'RM number',
			description: 'RM number as typed in iNews',
			type: ConfigManifestEntryType.STRING,
			required: true,
			defaultVal: '',
			rank: 0
		},
		{
			id: 'AtemSource',
			name: 'ATEM input',
			description: 'ATEM vision mixer input for RM input',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 0,
			rank: 1
		},
		{
			id: 'SisyfosLayers',
			name: 'Sisyfos layers',
			description: 'Sisyfos layers for RM input',
			type: ConfigManifestEntryType.LAYER_MAPPINGS,
			filters: {
				deviceTypes: [TSR.DeviceType.SISYFOS]
			},
			required: true,
			multiple: true,
			defaultVal: [],
			rank: 2
		},
		{
			id: 'StudioMics',
			name: 'Use Studio Mics',
			description: 'Add Sisyfos layers for Studio Mics',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: false,
			rank: 3
		},
		{
			id: 'KeepAudioInStudio',
			name: 'Keep audio in Studio',
			description: 'Keep audio in Studio',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: true,
			rank: 4
		}
	]
}

export const manifestAFVDSourcesDelayedPlayback: ConfigManifestEntryTable = {
	id: 'SourcesDelayedPlayback',
	name: 'EVS Mapping',
	description: 'EVS number to ATEM input',
	type: ConfigManifestEntryType.TABLE,
	required: false,
	defaultVal: literal<Array<TableConfigItemSourceMappingWithSisyfos & TableConfigItemValue[0]>>([
		{
			_id: '',
			SourceName: '1',
			AtemSource: 22,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceEVS_1],
			StudioMics: true
		},
		{
			_id: '',
			SourceName: '2',
			AtemSource: 23,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceEVS_2],
			StudioMics: true
		}
	]),
	columns: [
		{
			id: 'SourceName',
			name: 'EVS number',
			description: 'EVS number as typed in iNews',
			type: ConfigManifestEntryType.STRING,
			required: true,
			defaultVal: '',
			rank: 0
		},
		{
			id: 'AtemSource',
			name: 'ATEM input',
			description: 'ATEM vision mixer input for RM input',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 0,
			rank: 1
		},
		{
			id: 'SisyfosLayers',
			name: 'Sisyfos layers',
			description: 'Sisyfos layers for EVS input',
			type: ConfigManifestEntryType.LAYER_MAPPINGS,
			filters: {
				deviceTypes: [TSR.DeviceType.SISYFOS]
			},
			required: true,
			multiple: true,
			defaultVal: [],
			rank: 2
		},
		{
			id: 'StudioMics',
			name: 'Use Studio Mics',
			description: 'Add Sisyfos layers for Studio Mics',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: true,
			rank: 3
		}
	]
}

export const manifestAFVDSourcesSkype: ConfigManifestEntryTable = {
	/*

	*/
	id: 'SourcesSkype',
	name: 'Skype Mapping',
	description: 'Skype number to ATEM input',
	type: ConfigManifestEntryType.TABLE,
	required: false,
	defaultVal: literal<Array<TableConfigItemSourceMappingWithSisyfos & TableConfigItemValue[0]>>([
		{
			_id: '',
			SourceName: '1',
			AtemSource: 1,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_1],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '2',
			AtemSource: 2,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_2],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '3',
			AtemSource: 3,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_3],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '4',
			AtemSource: 4,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_4],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '5',
			AtemSource: 5,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_5],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '6',
			AtemSource: 6,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_6],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '7',
			AtemSource: 7,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_7],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '8',
			AtemSource: 8,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_8],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '9',
			AtemSource: 9,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_9],
			StudioMics: false
		},
		{
			_id: '',
			SourceName: '10',
			AtemSource: 10,
			SisyfosLayers: [SisyfosLLAyer.SisyfosSourceLive_10],
			StudioMics: false
		}
	]),
	columns: [
		{
			id: 'SourceName',
			name: 'Skype number',
			description: 'Skype number as typed in iNews',
			type: ConfigManifestEntryType.STRING,
			required: true,
			defaultVal: '',
			rank: 0
		},
		{
			id: 'AtemSource',
			name: 'ATEM input',
			description: 'ATEM vision mixer input for Skype input',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 0,
			rank: 1
		},
		{
			id: 'SisyfosLayers',
			name: 'Sisyfos layers',
			description: 'Sisyfos layers for Skype input',
			type: ConfigManifestEntryType.LAYER_MAPPINGS,
			filters: {
				deviceTypes: [TSR.DeviceType.SISYFOS]
			},
			required: true,
			multiple: true,
			defaultVal: [],
			rank: 2
		},
		{
			id: 'StudioMics',
			name: 'Use Studio Mics',
			description: 'Add Sisyfos layers for Studio Mics',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: false,
			rank: 3
		}
	]
}

export const manifestAFVDSourcesABMediaPlayers: ConfigManifestEntryTable = {
	id: 'ABMediaPlayers',
	name: 'Media Players inputs',
	description: 'ATEM inputs for A/B media players',
	type: ConfigManifestEntryType.TABLE,
	required: false,
	defaultVal: literal<Array<TableConfigItemSourceMapping & TableConfigItemValue[0]>>([
		{
			_id: '',
			SourceName: '1',
			AtemSource: 26
		},
		{
			_id: '',
			SourceName: '2',
			AtemSource: 27
		}
	]),
	columns: [
		{
			id: 'SourceName',
			name: 'Media player',
			description: 'Media player name as typed in iNews',
			type: ConfigManifestEntryType.STRING,
			required: true,
			defaultVal: '',
			rank: 0
		},
		{
			id: 'AtemSource',
			name: 'ATEM input',
			description: 'ATEM vision mixer input for Media player',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 0,
			rank: 1
		}
	]
}

export const manifestAFVDStudioMics: ConfigManifestEntry = {
	id: 'StudioMics',
	name: 'Studio Mics',
	description: 'Sisyfos layers for Studio Mics',
	type: ConfigManifestEntryType.LAYER_MAPPINGS,
	filters: {
		deviceTypes: [TSR.DeviceType.SISYFOS]
	},
	required: true,
	multiple: true,
	defaultVal: DEFAULT_STUDIO_MICS_LAYERS
}

export const manifestAFVDDownstreamKeyers: ConfigManifestEntryTable = {
	id: 'AtemSource.DSK',
	name: 'ATEM DSK',
	description: 'ATEM Downstream Keyers Fill and Key',
	type: ConfigManifestEntryType.TABLE,
	required: false,
	defaultVal: literal<Array<TableConfigItemDSK & TableConfigItemValue[0]>>([{ _id: '', ...defaultDSK }]),
	columns: [
		{
			id: 'Number',
			name: 'Number',
			description: 'DSK number, starting from 1',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 1,
			rank: 0
		},
		{
			id: 'Fill',
			name: 'ATEM Fill',
			description: 'ATEM vision mixer input for DSK Fill',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 21,
			rank: 1
		},
		{
			id: 'Key',
			name: 'ATEM Key',
			description: 'ATEM vision mixer input for DSK Key',
			type: ConfigManifestEntryType.NUMBER,
			required: true,
			defaultVal: 34,
			rank: 2
		},
		{
			id: 'Toggle',
			name: 'AdLib Toggle',
			description: 'Make AdLib that toggles the DSK',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: false,
			rank: 3
		},
		{
			id: 'DefaultOn',
			name: 'On by default',
			description: 'Enable the DSK in the baseline',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: false,
			rank: 4
		},
		{
			id: 'FullSource',
			name: 'Full graphic source',
			description: 'Use the DSK Fill as a source for Full graphics',
			type: ConfigManifestEntryType.BOOLEAN,
			required: true,
			defaultVal: false,
			rank: 5
		}
	]
}

export const studioConfigManifest: ConfigManifestEntry[] = [
	...MakeConfigWithMediaFlow('Clip', '', 'flow0', '.mxf', '', false),
	...MakeConfigWithMediaFlow('Jingle', '', 'flow1', '.mov', '', true),
	...MakeConfigWithMediaFlow('Graphic', '', 'flow2', '.png', '', true),
	manifestAFVDSourcesCam,
	manifestAFVDSourcesRM,
	manifestAFVDSourcesDelayedPlayback,
	manifestAFVDSourcesSkype,
	manifestAFVDSourcesABMediaPlayers,
	manifestAFVDStudioMics,
	manifestAFVDDownstreamKeyers,
	{
		id: 'ABPlaybackDebugLogging',
		name: 'Media players selection debug logging',
		description: 'Enable debug logging for A/B media player selection',
		type: ConfigManifestEntryType.BOOLEAN,
		required: false,
		defaultVal: false
	},
	{
		id: 'AtemSource.ServerC',
		name: 'CasparCG Server C',
		description: 'ATEM vision mixer input for ServerC',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 28
	},
	{
		id: 'AtemSource.JingleFill',
		name: 'Jingle Fill Source',
		description: 'ATEM vision mixer input for Jingle Fill',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 29
	},
	{
		id: 'AtemSource.JingleKey',
		name: 'Jingle Key Source',
		description: 'ATEM vision mixer input for Jingle Source',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 31
	},
	{
		id: 'AtemSettings.VizClip',
		name: 'Viz keyer clip',
		description: 'Viz keyer clip',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 50.0
	},
	{
		id: 'AtemSettings.VizGain',
		name: 'Viz keyer gain',
		description: 'Viz keyer gain',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 12.5
	},
	{
		id: 'AtemSettings.CCGClip',
		name: 'CasparCG keyer clip',
		description: 'CasparCG keyer clip',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 50.0
	},
	{
		id: 'AtemSettings.CCGGain',
		name: 'CasparCG keyer gain',
		description: 'CasparCG keyer gain',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 12.5
	},
	{
		id: 'AtemSource.SplitArtF',
		name: 'ATEM Split Screen Art Fill',
		description: 'ATEM vision mixer input for Split Screen Art Fill',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 30
	},
	{
		id: 'AtemSource.SplitArtK',
		name: 'ATEM Split Screen Art Key',
		description: 'ATEM vision mixer input for Split Screen Art Key',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 32
	},
	{
		id: 'AtemSource.FullFrameGrafikBackground',
		name: 'Full frame grafik background source',
		description: 'ATEM source for mos full-frame grafik background source',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 36
	},
	{
		id: 'AtemSource.Default',
		name: 'ATEM Default source',
		description: 'ATEM vision mixer default source',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: AtemSourceIndex.Col1
	},
	{
		id: 'AtemSource.MixMinusDefault',
		name: 'ATEM Mix-minus default source',
		description: 'ATEM vision mixer default source for mix-minus',
		type: ConfigManifestEntryType.NUMBER,
		required: true,
		defaultVal: AtemSourceIndex.Col1
	},
	{
		id: 'AtemSource.Continuity',
		name: 'ATEM continuity source',
		description: 'ATEM input for continuity',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: AtemSourceIndex.Col2
	},
	{
		id: 'AtemSettings.MP1Baseline.Clip',
		name: 'ATEM MP1 baseline clip number',
		description: 'Number of the clip to play on MP1 (counting from 1)',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 1
	},
	{
		id: 'AtemSettings.MP1Baseline.Loop',
		name: 'ATEM MP1 baseline clip loop',
		description: 'If the clip on MP1 should loop',
		type: ConfigManifestEntryType.BOOLEAN,
		required: false,
		defaultVal: true
	},
	{
		id: 'AtemSettings.MP1Baseline.Playing',
		name: 'ATEM MP1 baseline clip playing',
		description: 'If the clip on MP1 should play',
		type: ConfigManifestEntryType.BOOLEAN,
		required: false,
		defaultVal: true
	},
	{
		id: 'AudioBedSettings.fadeIn',
		name: 'Bed Fade In',
		description: 'Default fade in duration for audio beds',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 25
	},
	{
		id: 'AudioBedSettings.volume',
		name: 'Bed Volume',
		description: 'Volume (0 - 100)',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 80
	},
	{
		id: 'AudioBedSettings.fadeOut',
		name: 'Bed Fade Out',
		description: 'Default fade out duration for audio beds',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 25
	},
	{
		id: 'CasparPrerollDuration',
		name: 'Caspar preroll duration',
		description: 'ms of preroll before switching to caspar',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 200 // 5 frames
	},
	{
		id: 'MaximumPartDuration',
		name: 'Maximum Part Duration',
		description: 'Maximum duration (ms) to give parts in UI',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 10000
	},
	{
		id: 'DefaultPartDuration',
		name: 'Default Part Duration',
		description: 'Duration to give parts by default',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 4000
	},
	{
		id: 'ServerPostrollDuration',
		name: 'Server Postroll Duration',
		description: 'ms of postroll at the end of Server and VO clips',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 0
	},
	/** Graphics */
	{
		id: 'GraphicsType',
		name: 'Graphics Type',
		description: 'Graphics renderer to use',
		type: ConfigManifestEntryType.SELECT,
		required: true,
		defaultVal: 'VIZ',
		options: ['HTML', 'VIZ'],
		multiple: false
	},
	{
		id: 'HTMLGraphics.GraphicURL',
		name: 'Full Graphic URL (HTML)',
		description: 'URL to serve full graphics from',
		type: ConfigManifestEntryType.STRING,
		required: false,
		defaultVal: 'localhost'
	},
	{
		id: 'HTMLGraphics.KeepAliveDuration',
		name: 'Full Keep Alive Duration (HTML)',
		description: 'How long to keep the old part alive when going to a full',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 1000
	},
	{
		id: 'HTMLGraphics.TransitionSettings.borderSoftness',
		name: 'Full graphic wipe softness (HTML)',
		description: 'Border softness of full graphic background wipe',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 7500
	},
	{
		id: 'HTMLGraphics.TransitionSettings.loopOutTransitionDuration',
		name: 'Full graphic background loop out transition duration',
		description: 'Duration (ms) that the background loop behind a full takes to transition out',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 120
	},
	{
		id: 'HTMLGraphics.TransitionSettings.wipeRate',
		name: 'Full graphic background loop wipe duration (HTML)',
		description: 'Frames (max 250) over which to wipe background loop behind Full',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 10
	},
	{
		id: 'VizPilotGraphics.CutToMediaPlayer',
		name: 'Pilot media Player Cut Point',
		description: 'ms from start of grafik before switching to background source',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 500
	},
	{
		id: 'VizPilotGraphics.KeepAliveDuration',
		name: 'Pilot Keepalive Duration',
		description: 'ms to keep old part alive before switching to Pilot elements',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 2000
	},
	{
		id: 'VizPilotGraphics.OutTransitionDuration',
		name: 'Pilot Out Transition Duration',
		description: 'ms to keep pilot elements alive before transition to next part',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 1000
	},
	{
		id: 'VizPilotGraphics.PrerollDuration',
		name: 'Pilot Preroll Duration',
		description: 'ms of preroll before switching to Pilot elements',
		type: ConfigManifestEntryType.NUMBER,
		required: false,
		defaultVal: 2000
	},
	{
		id: 'PreventOverlayWithFull',
		name: 'Prevent Overlay with Full',
		description: 'Stop overlay elements from showing when a Full graphic is on-air',
		type: ConfigManifestEntryType.BOOLEAN,
		required: false,
		defaultVal: true
	}
]
