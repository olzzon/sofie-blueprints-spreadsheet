import { PartContext, SplitsContent } from 'tv-automation-sofie-blueprints-integration'
import { CueDefinitionDVE, DVEConfigInput, DVEOptions, MakeContentDVEBase, PartDefinition } from 'tv2-common'
import { OfftubeAtemLLayer, OfftubeCasparLLayer, OfftubeSisyfosLLayer } from '../../tv2_offtube_studio/layers'
import { OffTubeShowstyleBlueprintConfig } from '../helpers/config'
import { OffTubeSourceLayer } from '../layers'

export const boxLayers = {
	INP1: OffTubeSourceLayer.PgmDVEBox1,
	INP2: OffTubeSourceLayer.PgmDVEBox2,
	INP3: OffTubeSourceLayer.PgmDVEBox3,
	INP4: OffTubeSourceLayer.PgmDVEBox4
}

export const boxMappings: [string, string, string, string] = [
	OfftubeAtemLLayer.AtemSSrcBox1,
	OfftubeAtemLLayer.AtemSSrcBox2,
	OfftubeAtemLLayer.AtemSSrcBox3,
	OfftubeAtemLLayer.AtemSSrcBox4
]

export const OFFTUBE_DVE_GENERATOR_OPTIONS: DVEOptions = {
	dveLayers: {
		ATEM: {
			SSrcDefault: OfftubeAtemLLayer.AtemSSrcDefault,
			SSrcArt: OfftubeAtemLLayer.AtemSSrcArt,
			MEProgram: OfftubeAtemLLayer.AtemMEProgram
		},
		CASPAR: {
			CGDVEKey: OfftubeCasparLLayer.CasparCGDVEKey,
			CGDVEFrame: OfftubeCasparLLayer.CasparCGDVEFrame,
			CGDVETemplate: OfftubeCasparLLayer.CasparCGDVETemplate
		},
		SisyfosLLayer: {
			ClipPending: OfftubeSisyfosLLayer.SisyfosSourceClipPending
		},
		CasparLLayer: {
			ClipPending: OfftubeCasparLLayer.CasparPlayerClipPending
		}
	},
	dveTimelineGenerators: {
		GetSisyfosTimelineObjForCamera: () => [], // TODO
		GetSisyfosTimelineObjForEkstern: () => [], // TODO,
		GetLayerForEkstern: () => [] // TODO
	},
	boxLayers,
	boxMappings,
	STICKY_LAYERS: [], // TODO
	LIVE_AUDIO: [], // TODO
	AUDIO_LAYERS: [], // TODO
	EXCLUDED_LAYERS: [] // TODO
}

export function OfftubeMakeContentDVE(
	context: PartContext,
	config: OffTubeShowstyleBlueprintConfig,
	partDefinition: PartDefinition,
	parsedCue: CueDefinitionDVE,
	dveConfig: DVEConfigInput | undefined,
	addClass?: boolean
): { content: SplitsContent; valid: boolean; stickyLayers: string[] } {
	return MakeContentDVEBase(
		context,
		config,
		partDefinition,
		parsedCue,
		dveConfig,
		OFFTUBE_DVE_GENERATOR_OPTIONS,
		addClass,
		true
	)
}
