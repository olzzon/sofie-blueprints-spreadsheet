import {
	DeviceType,
	TimelineContentTypeAtem,
	TimelineContentTypeCasparCg,
	TimelineContentTypeVizMSE,
	TimelineObjAtemAUX,
	TimelineObjCCGMedia,
	TimelineObjVIZMSEElementInternal,
	TSRTimelineObj
} from 'timeline-state-resolver-types'
import {
	CameraContent,
	GraphicsContent,
	IBlueprintAdLibPiece,
	IBlueprintPiece,
	PartContext,
	PieceLifespan,
	SourceLayerType
} from 'tv-automation-sofie-blueprints-integration'
import {
	CalculateTime,
	CueDefinitionVIZ,
	FindSourceInfoStrict,
	literal,
	TV2BlueprintConfigBase,
	TV2StudioConfigBase
} from 'tv2-common'
import * as _ from 'underscore'

export interface VizCueSourceLayers {
	SourceLayerDVEBackground: string
	CasparLLayerDVELoop: string
	SourceLayerVizFullIn1?: string
	AtemLLayerAtemAuxVizOvlIn1?: string
	SourceLayerDesign?: string
	GraphicLLayerGraphicLLayerDesign?: string
}

export function EvaluateVIZBase<
	StudioConfig extends TV2StudioConfigBase,
	ShowStyleConfig extends TV2BlueprintConfigBase<StudioConfig>
>(
	context: PartContext,
	config: ShowStyleConfig,
	pieces: IBlueprintPiece[],
	adlibPieces: IBlueprintAdLibPiece[],
	partId: string,
	parsedCue: CueDefinitionVIZ,
	useVizEngine: boolean,
	sourceLayers: VizCueSourceLayers,
	adlib?: boolean,
	rank?: number
) {
	if (parsedCue.design.match(/^dve-triopage$/i)) {
		const fileName = parsedCue.content.TRIOPAGE ? parsedCue.content.TRIOPAGE : parsedCue.content.GRAFIK
		const path = `dve/${fileName}`
		if (adlib) {
			adlibPieces.push(
				literal<IBlueprintAdLibPiece>({
					_rank: rank || 0,
					externalId: partId,
					name: fileName,
					outputLayerId: 'sec',
					sourceLayerId: sourceLayers.SourceLayerDVEBackground,
					infiniteMode: PieceLifespan.Infinite,
					content: literal<GraphicsContent>({
						fileName,
						path,
						timelineObjects: _.compact<TSRTimelineObj>([
							literal<TimelineObjCCGMedia>({
								id: '',
								enable: { start: 0 },
								priority: 100,
								layer: sourceLayers.CasparLLayerDVELoop,
								content: {
									deviceType: DeviceType.CASPARCG,
									type: TimelineContentTypeCasparCg.MEDIA,
									file: path,
									loop: true
								}
							})
						])
					})
				})
			)
		} else {
			pieces.push(
				literal<IBlueprintPiece>({
					_id: '',
					externalId: partId,
					name: fileName,
					enable: {
						start: parsedCue.start ? CalculateTime(parsedCue.start) : 0
					},
					outputLayerId: 'sec',
					sourceLayerId: sourceLayers.SourceLayerDVEBackground,
					infiniteMode: PieceLifespan.Infinite,
					content: literal<GraphicsContent>({
						fileName,
						path,
						timelineObjects: _.compact<TSRTimelineObj>([
							literal<TimelineObjCCGMedia>({
								id: '',
								enable: { start: 0 },
								priority: 100,
								layer: sourceLayers.CasparLLayerDVELoop,
								content: {
									deviceType: DeviceType.CASPARCG,
									type: TimelineContentTypeCasparCg.MEDIA,
									file: path,
									loop: true
								}
							})
						])
					})
				})
			)
		}
	} else if (parsedCue.rawType.match(/^VIZ=grafik-design$/i)) {
		context.warning('VIZ=grafik-design is not supported for this showstyle')
	} else if (parsedCue.rawType.match(/^VIZ=full$/i)) {
		if (useVizEngine) {
			if (sourceLayers.SourceLayerVizFullIn1 && sourceLayers.AtemLLayerAtemAuxVizOvlIn1) {
				if (!parsedCue.content.INP1) {
					context.warning(`No input provided by ${parsedCue.rawType}`)
					return
				}
				let sourceInfo = FindSourceInfoStrict(context, config.sources, SourceLayerType.REMOTE, parsedCue.content.INP1)
				if (!sourceInfo) {
					sourceInfo = FindSourceInfoStrict(context, config.sources, SourceLayerType.CAMERA, parsedCue.content.INP1)
					if (!sourceInfo) {
						context.warning(`Could not find source ${parsedCue.content.INP1}`)
						return
					}
				}
				pieces.push(
					literal<IBlueprintPiece>({
						_id: '',
						externalId: partId,
						enable: {
							start: parsedCue.start ? CalculateTime(parsedCue.start) : 0
						},
						name: parsedCue.content.INP1 || '',
						outputLayerId: 'aux',
						sourceLayerId: sourceLayers.SourceLayerVizFullIn1,
						infiniteMode: PieceLifespan.Infinite,
						content: literal<CameraContent>({
							studioLabel: '',
							switcherInput: sourceInfo.port,
							timelineObjects: _.compact<TSRTimelineObj>([
								literal<TimelineObjAtemAUX>({
									id: '',
									enable: { start: 0 },
									priority: 100,
									layer: sourceLayers.AtemLLayerAtemAuxVizOvlIn1,
									content: {
										deviceType: DeviceType.ATEM,
										type: TimelineContentTypeAtem.AUX,
										aux: {
											input: sourceInfo.port
										}
									}
								})
							])
						})
					})
				)
			} else {
				context.warning(`Could not route source to Viz engine, this studio is not configured correctly.`)
			}
		}
	} else {
		if (useVizEngine) {
			if (sourceLayers.SourceLayerDesign && sourceLayers.GraphicLLayerGraphicLLayerDesign) {
				const path = parsedCue.content.triopage ? parsedCue.content.triopage : parsedCue.content.GRAFIK

				if (!path || !path.length) {
					context.warning(`No valid template found for ${parsedCue.design}`)
					return
				}

				if (adlib) {
					adlibPieces.push(
						literal<IBlueprintAdLibPiece>({
							_rank: rank || 0,
							externalId: partId,
							name: path,
							outputLayerId: 'sec',
							sourceLayerId: sourceLayers.SourceLayerDesign,
							infiniteMode: PieceLifespan.Infinite,
							content: literal<GraphicsContent>({
								fileName: path,
								path,
								timelineObjects: _.compact<TSRTimelineObj>([
									literal<TimelineObjVIZMSEElementInternal>({
										id: '',
										enable: { start: 0 },
										priority: 100,
										layer: sourceLayers.GraphicLLayerGraphicLLayerDesign,
										content: {
											deviceType: DeviceType.VIZMSE,
											type: TimelineContentTypeVizMSE.ELEMENT_INTERNAL,
											templateName: path,
											templateData: []
										}
									})
								])
							})
						})
					)
				} else {
					pieces.push(
						literal<IBlueprintPiece>({
							_id: '',
							externalId: partId,
							name: path,
							enable: {
								start: parsedCue.start ? CalculateTime(parsedCue.start) : 0
							},
							outputLayerId: 'sec',
							sourceLayerId: sourceLayers.SourceLayerDesign,
							infiniteMode: PieceLifespan.Infinite,
							content: literal<GraphicsContent>({
								fileName: path,
								path,
								timelineObjects: _.compact<TSRTimelineObj>([
									literal<TimelineObjVIZMSEElementInternal>({
										id: '',
										enable: { start: 0 },
										priority: 100,
										layer: sourceLayers.GraphicLLayerGraphicLLayerDesign,
										content: {
											deviceType: DeviceType.VIZMSE,
											type: TimelineContentTypeVizMSE.ELEMENT_INTERNAL,
											templateName: path,
											templateData: []
										}
									})
								])
							})
						})
					)
				}
			} else {
				context.warning(`Could not create VIZ design, this studio is not configured correctly.`)
			}
		}
	}
}
