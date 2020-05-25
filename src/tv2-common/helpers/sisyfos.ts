import * as _ from 'underscore'

import { NotesContext, SourceLayerType, Timeline, TSR } from 'tv-automation-sofie-blueprints-integration'
import { FindSourceInfoStrict, SourceInfo, TV2StudioBlueprintConfigBase, TV2StudioConfigBase } from 'tv2-common'
import { PieceMetaData } from '../onTimelineGenerate'
import { literal } from '../util'

export function GetStickyForPiece(
	layers: Array<{ layer: string; isPgm: 0 | 1 | 2 }>,
	STICKY_LAYERS: string[]
): PieceMetaData | undefined {
	return literal<PieceMetaData>({
		stickySisyfosLevels: _.object(
			layers
				.filter(layer => STICKY_LAYERS.indexOf(layer.layer) !== -1)
				.map<[string, { value: number; followsPrevious: boolean }]>(layer => {
					return [
						layer.layer,
						{
							value: layer.isPgm,
							followsPrevious: false
						}
					]
				})
		)
	})
}

export function GetEksternMetaData(
	STICKY_LAYERS: string[],
	studioMics: string[],
	layers?: string[]
): PieceMetaData | undefined {
	return layers && layers.length
		? GetStickyForPiece(
				[
					...layers.map<{ layer: string; isPgm: 0 | 1 | 2 }>(layer => {
						return { layer, isPgm: 1 }
					}),
					...studioMics.map<{ layer: string; isPgm: 0 | 1 | 2 }>(l => {
						return { layer: l, isPgm: 1 }
					})
				],
				STICKY_LAYERS
		  )
		: undefined
}

export function GetCameraMetaData(
	config: TV2StudioBlueprintConfigBase<TV2StudioConfigBase>,
	layers?: string[]
): PieceMetaData | undefined {
	return GetStickyForPiece(
		[...(layers || []), ...config.studio.StudioMics].map<{ layer: string; isPgm: 0 | 1 | 2 }>(l => {
			return { layer: l, isPgm: 1 }
		}),
		config.stickyLayers
	)
}

export function GetSisyfosTimelineObjForEkstern(
	context: NotesContext,
	sources: SourceInfo[],
	sourceType: string,
	getLayersForEkstern: (context: NotesContext, sources: SourceInfo[], sourceType: string) => string[] | undefined,
	enable?: Timeline.TimelineEnable
): TSR.TSRTimelineObj[] {
	if (!enable) {
		enable = { start: 0 }
	}

	const audioTimeline: TSR.TSRTimelineObj[] = []
	const layers = getLayersForEkstern(context, sources, sourceType)

	if (!layers || !layers.length) {
		context.warning(`Could not set audio levels for ${sourceType}`)
		return audioTimeline
	}

	layers.forEach(layer => {
		audioTimeline.push(
			literal<TSR.TimelineObjSisyfosMessage>({
				id: '',
				enable: enable!,
				priority: 1,
				layer,
				content: {
					deviceType: TSR.DeviceType.SISYFOS,
					type: TSR.TimelineContentTypeSisyfos.SISYFOS,
					isPgm: 1
				}
			})
		)
	})
	return audioTimeline
}

export function GetLayersForEkstern(context: NotesContext, sources: SourceInfo[], sourceType: string) {
	const eksternProps = sourceType.match(/^(?:LIVE|SKYPE) ([^\s]+)(?: (.+))?$/i)
	const eksternLayers: string[] = []
	if (eksternProps) {
		const sourceInfo = FindSourceInfoStrict(context, sources, SourceLayerType.REMOTE, sourceType)
		if (sourceInfo && sourceInfo.sisyfosLayers) {
			eksternLayers.push(...sourceInfo.sisyfosLayers)
		}
	}
	return eksternLayers
}

export function GetSisyfosTimelineObjForCamera(
	context: NotesContext,
	config: { sources: SourceInfo[]; studio: { StudioMics: string[] } },
	sourceType: string,
	enable?: Timeline.TimelineEnable
): TSR.TSRTimelineObj[] {
	if (!enable) {
		enable = { start: 0 }
	}

	const audioTimeline: TSR.TSRTimelineObj[] = []
	const useMic = !sourceType.match(/^(?:KAM|CAM)(?:ERA)? (.+) minus mic(.*)$/i)
	const camName = sourceType.match(/^(?:KAM|CAM)(?:ERA)? (.+)$/i)
	const nonCam = !!sourceType.match(/server|telefon|full|evs/i)
	if ((useMic && camName) || nonCam) {
		const camLayers: string[] = []
		if (useMic && camName) {
			const sourceInfo = FindSourceInfoStrict(context, config.sources, SourceLayerType.CAMERA, sourceType)
			if (sourceInfo) {
				if (sourceInfo.sisyfosLayers) {
					camLayers.push(...sourceInfo.sisyfosLayers)
				}
				if (sourceInfo.useStudioMics) {
					camLayers.push(...config.studio.StudioMics)
				}
			}
		} else if (nonCam) {
			camLayers.push(...config.studio.StudioMics)
		}
		audioTimeline.push(
			...camLayers.map<TSR.TimelineObjSisyfosMessage>(layer => {
				return literal<TSR.TimelineObjSisyfosMessage>({
					id: '',
					enable: enable ? enable : { start: 0 },
					priority: 1,
					layer,
					content: {
						deviceType: TSR.DeviceType.SISYFOS,
						type: TSR.TimelineContentTypeSisyfos.SISYFOS,
						isPgm: 1
					}
				})
			})
		)
	}
	return audioTimeline
}

export function GetLayersForCamera(config: TV2StudioBlueprintConfigBase<TV2StudioConfigBase>, sourceInfo: SourceInfo) {
	const cameraLayers: string[] = []
	if (sourceInfo.sisyfosLayers) {
		cameraLayers.push(...sourceInfo.sisyfosLayers)
	}
	if (sourceInfo.useStudioMics) {
		cameraLayers.push(...config.studio.StudioMics)
	}
	return cameraLayers
}

export function getStickyLayers(studioConfig: TV2StudioConfigBase) {
	return [...studioConfig.StudioMics, ...getLiveAudioLayers(studioConfig)]
}

export function getLiveAudioLayers(studioConfig: TV2StudioConfigBase): string[] {
	const res: Set<string> = new Set()

	_.each([studioConfig.SourcesRM, studioConfig.SourcesSkype], sources => {
		_.each(sources, src => {
			if (src.SisyfosLayers) {
				_.each(src.SisyfosLayers, layer => {
					res.add(layer)
				})
			}
		})
	})

	return Array.from(res)
}
