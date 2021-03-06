import * as _ from 'underscore'
import { CORE_INJECTED_KEYS, studioConfigManifest } from '../config-manifests'
import { StudioConfig } from '../helpers/config'

const blankStudioConfig: StudioConfig = {
	SofieHostURL: '',

	ClipMediaFlowId: '',
	GraphicMediaFlowId: '',
	JingleMediaFlowId: '',
	JingleFileExtension: '',
	ClipFileExtension: 'mxf',
	GraphicFileExtension: '.png',
	ClipNetworkBasePath: '/',
	GraphicNetworkBasePath: '/',
	JingleNetworkBasePath: '/',
	ClipFolder: '',
	GraphicFolder: '',
	JingleFolder: '',
	GraphicIgnoreStatus: false,
	JingleIgnoreStatus: false,
	ClipIgnoreStatus: false,
	SourcesCam: [],
	SourcesRM: [],
	SourcesSkype: [],
	SourcesDelayedPlayback: [],
	ABMediaPlayers: [],
	StudioMics: [],
	ABPlaybackDebugLogging: false,

	AtemSource: {
		DSK: [],
		ServerC: 0,
		JingleFill: 0,
		JingleKey: 0,
		SplitArtF: 0,
		SplitArtK: 0,
		Default: 0,
		MixMinusDefault: 0,
		Continuity: 0,
		FullFrameGrafikBackground: 0
	},
	AtemSettings: {
		CCGClip: 0,
		CCGGain: 0,
		VizClip: 0,
		VizGain: 0,
		MP1Baseline: {
			Clip: 1,
			Loop: false,
			Playing: true
		}
	},
	AudioBedSettings: {
		fadeIn: 0,
		fadeOut: 0,
		volume: 0
	},
	CasparPrerollDuration: 0,
	PreventOverlayWithFull: true,
	MaximumPartDuration: 0,
	DefaultPartDuration: 0,
	ServerPostrollDuration: 5000,
	GraphicsType: 'HTML',
	VizPilotGraphics: {
		KeepAliveDuration: 1000,
		PrerollDuration: 1000,
		OutTransitionDuration: 1000,
		CutToMediaPlayer: 1000
	},
	HTMLGraphics: {
		GraphicURL: '',
		KeepAliveDuration: 1000,
		TransitionSettings: {
			wipeRate: 20,
			borderSoftness: 7500,
			loopOutTransitionDuration: 120
		}
	}
}

function getObjectKeys(obj: any): string[] {
	const definedKeys: string[] = []
	const processObj = (prefix: string, o: any) => {
		_.each(_.keys(o), k => {
			if (_.isArray(o[k])) {
				definedKeys.push(prefix + k)
			} else if (_.isObject(o[k])) {
				processObj(prefix + k + '.', o[k])
			} else {
				definedKeys.push(prefix + k)
			}
		})
	}
	processObj('', obj)
	return definedKeys
}

describe('Config Manifest', () => {
	test('Exposed Studio Keys', () => {
		const studioManifestKeys = _.map(studioConfigManifest, e => e.id)
		const manifestKeys = studioManifestKeys.concat(CORE_INJECTED_KEYS).sort()

		const definedKeys = getObjectKeys(blankStudioConfig)

		expect(manifestKeys).toEqual(definedKeys.sort())
	})
})
