import { NotesContext, TimelineObjectCoreExt, TSR, VTContent } from 'tv-automation-sofie-blueprints-integration'
import {
	AddParentClass,
	GetSisyfosTimelineObjForCamera,
	literal,
	PartDefinition,
	ServerParentClass,
	TransitionFromString,
	TransitionSettings
} from 'tv2-common'
import { ControlClasses, GetEnableClassForServer } from 'tv2-constants'
import { TV2BlueprintConfig } from '../blueprintConfig'
import { TimelineBlueprintExt } from '../onTimelineGenerate'
import { AdlibServerOfftubeOptions } from '../pieces'

// TODO: These are TSR layers, not sourcelayers
export interface MakeContentServerSourceLayers {
	Caspar: {
		ClipPending: string
	}
	Sisyfos: {
		ClipPending: string
		StudioMicsGroup: string
	}
}

export interface VTFields {
	file: string
	duration: number
}

type VTProps = Pick<
	VTContent,
	| 'studioLabel'
	| 'fileName'
	| 'path'
	| 'mediaFlowIds'
	| 'firstWords'
	| 'lastWords'
	| 'postRollDuration'
	| 'ignoreMediaObjectStatus'
>

export function GetVTContentProperties(config: TV2BlueprintConfig, file: string): VTProps {
	return literal<VTProps>({
		studioLabel: '',
		fileName: file,
		path: `${config.studio.NetworkBasePath}\\${file}${config.studio.ClipFileExtension}`, // full path on the source network storage
		mediaFlowIds: [config.studio.MediaFlowId],
		firstWords: '',
		lastWords: '',
		postRollDuration: config.studio.ServerPostrollDuration
	})
}

export function MakeContentServer(
	context: NotesContext,
	file: string,
	mediaPlayerSessionId: string,
	partDefinition: PartDefinition,
	config: TV2BlueprintConfig,
	sourceLayers: MakeContentServerSourceLayers,
	duration: number,
	adLib?: boolean,
	offtubeOptions?: AdlibServerOfftubeOptions,
	vo?: boolean
): VTContent {
	return literal<VTContent>({
		...GetVTContentProperties(config, file),
		ignoreMediaObjectStatus: true,
		timelineObjects: GetServerTimeline(
			context,
			file,
			mediaPlayerSessionId,
			partDefinition,
			config,
			sourceLayers,
			duration,
			adLib,
			offtubeOptions,
			vo
		)
	})
}

function GetServerTimeline(
	context: NotesContext,
	file: string,
	mediaPlayerSessionId: string,
	partDefinition: PartDefinition,
	config: TV2BlueprintConfig,
	sourceLayers: MakeContentServerSourceLayers,
	duration: number,
	adLib?: boolean,
	offtubeOptions?: AdlibServerOfftubeOptions,
	vo?: boolean
) {
	const serverEnableClass = `.${GetEnableClassForServer(mediaPlayerSessionId)}`

	const mediaObj = literal<TSR.TimelineObjCCGMedia & TimelineBlueprintExt>({
		id: '',
		enable: {
			while: serverEnableClass
		},
		priority: 1,
		layer: sourceLayers.Caspar.ClipPending,
		content: {
			deviceType: TSR.DeviceType.CASPARCG,
			type: TSR.TimelineContentTypeCasparCg.MEDIA,
			file,
			loop: offtubeOptions?.isOfftube ? false : adLib,
			seek: 0,
			length: duration,
			playing: true
		},
		metaData: {
			mediaPlayerSession: mediaPlayerSessionId
		},
		classes: [...(AddParentClass(partDefinition) && !adLib ? [ServerParentClass('studio0', file)] : [])]
	})

	const mediaOffObj = JSON.parse(JSON.stringify(mediaObj)) as TSR.TimelineObjCCGMedia & TimelineBlueprintExt
	mediaOffObj.enable = { while: `!${serverEnableClass}` }
	mediaOffObj.content.playing = false

	return literal<TimelineObjectCoreExt[]>([
		mediaObj,
		mediaOffObj,

		literal<TSR.TimelineObjSisyfosChannel & TimelineBlueprintExt>({
			id: '',
			enable: {
				while: serverEnableClass
			},
			priority: 1,
			layer: sourceLayers.Sisyfos.ClipPending,
			content: {
				deviceType: TSR.DeviceType.SISYFOS,
				type: TSR.TimelineContentTypeSisyfos.CHANNEL,
				// isPgm: voiceOver ? 2 : 1
				isPgm: 1
			},
			metaData: {
				mediaPlayerSession: mediaPlayerSessionId
			},
			classes: []
		}),

		...config.stickyLayers.map<TSR.TimelineObjSisyfosChannel & TimelineBlueprintExt>(layer => {
			return literal<TSR.TimelineObjSisyfosChannel & TimelineBlueprintExt>({
				id: '',
				enable: {
					while: serverEnableClass
				},
				priority: 1,
				layer,
				content: {
					deviceType: TSR.DeviceType.SISYFOS,
					type: TSR.TimelineContentTypeSisyfos.CHANNEL,
					isPgm: 0
				},
				metaData: {
					sisyfosPersistLevel: true
				}
			})
		}),
		...(vo ? [GetSisyfosTimelineObjForCamera(context, config, 'server', sourceLayers.Sisyfos.StudioMicsGroup)] : [])
	])
}

export function CutToServer(
	mediaPlayerSessionId: string,
	partDefinition: PartDefinition,
	config: TV2BlueprintConfig,
	atemLLayerMEPGM: string,
	abstractLLayerEnableServer: string,
	atemLLayerServerLookaheadAux?: string,
	adLib?: boolean,
	offtubeOptions?: AdlibServerOfftubeOptions
) {
	return [
		EnableServer(abstractLLayerEnableServer, mediaPlayerSessionId),
		literal<TSR.TimelineObjAtemME & TimelineBlueprintExt>({
			id: '',
			enable: {
				start: config.studio.CasparPrerollDuration
			},
			priority: 1,
			layer: atemLLayerMEPGM,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.ME,
				me: {
					input: -1,
					transition: partDefinition.transition
						? TransitionFromString(partDefinition.transition.style)
						: TSR.AtemTransitionStyle.CUT,
					transitionSettings: TransitionSettings(partDefinition)
				}
			},
			metaData: {
				mediaPlayerSession: mediaPlayerSessionId
			},
			classes: [
				...(adLib && !offtubeOptions?.isOfftube ? ['adlib_deparent'] : []),
				...(offtubeOptions?.isOfftube ? [ControlClasses.AbstractLookahead] : [])
			]
		}),
		...(atemLLayerServerLookaheadAux
			? [
					literal<TSR.TimelineObjAtemAUX & TimelineBlueprintExt>({
						id: '',
						enable: {
							while: '1'
						},
						priority: 0,
						layer: atemLLayerServerLookaheadAux,
						content: {
							deviceType: TSR.DeviceType.ATEM,
							type: TSR.TimelineContentTypeAtem.AUX,
							aux: {
								input: -1
							}
						},
						metaData: {
							mediaPlayerSession: mediaPlayerSessionId
						}
					})
			  ]
			: [])
	]
}

function EnableServer(layer: string, mediaPlayerSessionId: string) {
	return literal<TSR.TimelineObjAbstractAny>({
		id: '',
		enable: {
			start: 0
		},
		layer,
		content: {
			deviceType: TSR.DeviceType.ABSTRACT
		},
		classes: [GetEnableClassForServer(mediaPlayerSessionId)]
	})
}
