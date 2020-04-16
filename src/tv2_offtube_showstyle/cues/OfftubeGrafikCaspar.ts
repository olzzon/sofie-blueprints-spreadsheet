import {
	AtemTransitionStyle,
	DeviceType,
	TimelineContentTypeAtem,
	TimelineContentTypeCasparCg,
	TimelineObjAtemME,
	TimelineObjCCGMedia,
	TimelineObjCCGTemplate,
	TSRTimelineObj
} from 'timeline-state-resolver-types'
import {
	IBlueprintAdLibPiece,
	IBlueprintPiece,
	PartContext,
	PieceLifespan
} from 'tv-automation-sofie-blueprints-integration'
import {
	CreateTimingEnable,
	CueDefinitionGrafik,
	CueDefinitionMOS,
	GraphicLLayer,
	InfiniteMode,
	literal,
	PartDefinition,
	PartToParentClass,
	TranslateEngine
} from 'tv2-common'
import { ControlClasses, CueType, Enablers, VizEngine } from 'tv2-constants'
import { OfftubeCasparLLayer } from '../../tv2_offtube_studio/layers'
import { OffTubeShowstyleBlueprintConfig } from '../helpers/config'
import { OfftubeOutputLayers, OffTubeSourceLayer } from '../layers'

export function OfftubeEvaluateGrafikCaspar(
	config: OffTubeShowstyleBlueprintConfig,
	_context: PartContext,
	_pieces: IBlueprintPiece[],
	adlibPieces: IBlueprintAdLibPiece[],
	_partid: string,
	parsedCue: CueDefinitionGrafik,
	_engine: VizEngine,
	_adlib: boolean,
	partDefinition: PartDefinition,
	_isTlfPrimary?: boolean,
	rank?: number
) {
	let engine = _engine
	if (config.showStyle.GFXTemplates) {
		const templ = config.showStyle.GFXTemplates.find(
			t =>
				t.INewsName.toUpperCase() === parsedCue.template.toUpperCase() &&
				t.INewsCode.toString()
					.replace(/=/gi, '')
					.toUpperCase() === parsedCue.iNewsCommand.toUpperCase()
		)
		if (templ) {
			if (templ.IsDesign) {
				return
			}

			engine = TranslateEngine(templ.VizDestination)
		}
	}

	const isIdentGrafik = !!parsedCue.template.match(/direkte/i)

	if (engine === 'FULL') {
		const piece = CreateFull(config, partDefinition, GetTemplateName(config, parsedCue))
		adlibPieces.push(piece)
	} else {
		// TODO: Wall
		const piece = literal<IBlueprintAdLibPiece>({
			_rank: rank || 0,
			externalId: partDefinition.externalId,
			name: `${grafikName(config, parsedCue)}`,
			sourceLayerId: GetSourceLayerForGrafik(config, GetTemplateName(config, parsedCue)),
			outputLayerId: OfftubeOutputLayers.OVERLAY,
			infiniteMode: PieceLifespan.Infinite,
			content: {
				timelineObjects: GetCasparOverlayTimeline(config, engine, parsedCue, isIdentGrafik, partDefinition)
			}
		})
		adlibPieces.push(piece)
	}
}

export function GetCasparOverlayTimeline(
	config: OffTubeShowstyleBlueprintConfig,
	engine: VizEngine,
	parsedCue: CueDefinitionGrafik,
	isIdentGrafik: boolean,
	partDefinition: PartDefinition
): TSRTimelineObj[] {
	return [
		literal<TimelineObjCCGTemplate>({
			id: '',
			enable: GetEnableForGrafikOfftube(engine, parsedCue, isIdentGrafik, partDefinition),
			layer: GetTimelineLayerForGrafik(config, GetTemplateName(config, parsedCue)),
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.TEMPLATE,
				templateType: 'html',
				name: GetTemplateName(config, parsedCue),
				data: literal<RendererStatePartial>({
					partialUpdate: true,
					rendererDisplay: 'program',
					slots: createContentForGraphicTemplate(GetTemplateName(config, parsedCue), parsedCue)
				}),
				useStopCommand: false
			}
		})
	]
}

function createContentForGraphicTemplate(graphicName: string, parsedCue: CueDefinitionGrafik): Partial<Slots> {
	switch (graphicName.toLowerCase()) {
		// TODO: When creating new templates in the future
		case 'arkiv':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.ARKIV,
						text: parsedCue.textFields[0]
					}
				}
			}
		case 'billederfra_logo':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.BILLEDERFRA_LOGO,
						logo: parsedCue.textFields[0]
					}
				}
			}
		case 'bund':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.BUND,
						firstLine: parsedCue.textFields[0], // TODO: Should this be more generic?
						secondLine: parsedCue.textFields[1]
					}
				}
			}
		case 'direkte':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.DIREKTE,
						location: parsedCue.textFields[0]
					}
				}
			}
		case 'ident_nyhederne':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.IDENT,
						variant: 'ident_nyhederne',
						text: parsedCue.textFields[0]
					}
				}
			}
		case 'ident_news':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.IDENT,
						variant: 'ident_news',
						text: parsedCue.textFields[0]
					}
				}
			}
		case 'ident_tv2sport':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.IDENT,
						variant: 'ident_tv2sport',
						text: parsedCue.textFields[0]
					}
				}
			}
		case 'ident_blank':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.IDENT,
						variant: 'ident_blank',
						text: parsedCue.textFields[0]
					}
				}
			}
		case 'topt':
			return {
				[graphicName]: {
					display: 'program',
					payload: {
						type: GraphicName.TOPT,
						text: parsedCue.textFields[0] // TODO: Should indexing be pulled from config?
					}
				}
			}
		default:
			// Unknown template
			// Loactors are skipped right now
			/**
			 * TODO: Maybe we could return the following, to allow for custom templates?
			 * {
			 * 		[graphicName]: {
			 * 			payload: {
			 * 				text: parsedCue.textFields
			 * 			}
			 * 		}
			 * }
			 */
			return {}
	}
}

function CreateFull(
	config: OffTubeShowstyleBlueprintConfig,
	partDefinition: PartDefinition,
	template: string
): IBlueprintAdLibPiece {
	return literal<IBlueprintAdLibPiece>({
		_rank: 0,
		externalId: partDefinition.externalId,
		name: `${template}`,
		sourceLayerId: OffTubeSourceLayer.SelectedAdlibGraphicsFull,
		outputLayerId: OfftubeOutputLayers.SELECTED_ADLIB,
		toBeQueued: true,
		canCombineQueue: true,
		infiniteMode: PieceLifespan.Infinite,
		content: {
			timelineObjects: [
				literal<TimelineObjCCGMedia>({
					id: '',
					enable: {
						while: `.${Enablers.OFFTUBE_ENABLE_FULL}`
					},
					priority: 100,
					layer: OfftubeCasparLLayer.CasparGraphicsFull,
					content: {
						deviceType: DeviceType.CASPARCG,
						type: TimelineContentTypeCasparCg.MEDIA,
						file: template,
						loop: true,
						mixer: {
							opacity: 100
						}
					}
				}),
				literal<TimelineObjAtemME>({
					id: '',
					enable: {
						while: `.${Enablers.OFFTUBE_ENABLE_FULL}`
					},
					priority: 100,
					layer: OfftubeCasparLLayer.CasparGraphicsFull,
					content: {
						deviceType: DeviceType.ATEM,
						type: TimelineContentTypeAtem.ME,
						me: {
							input: config.studio.AtemSource.GFXFull,
							transition: AtemTransitionStyle.CUT
						}
					}
				})
			]
		}
	})
}

// TODO: All of the below was copy-pasted and then adapted from AFVD blueprints, can they be made generic?

// TODO: Is this valid for offtubes?
function GetEnableForGrafikOfftube(
	engine: VizEngine,
	cue: CueDefinitionGrafik,
	isIdentGrafik: boolean,
	partDefinition?: PartDefinition
): TSRTimelineObj['enable'] {
	if (engine === 'WALL') {
		return {
			while: '1'
		}
	}
	if (isIdentGrafik) {
		return {
			while: `.${ControlClasses.ShowIdentGraphic} & !.full`
		}
	}

	if (cue.end && cue.end.infiniteMode && cue.end.infiniteMode === 'B' && partDefinition) {
		return { while: `.${PartToParentClass('studio0', partDefinition)} & !.adlib_deparent & !.full` }
	}

	const timing = CreateTimingEnable(cue)

	if (!timing.infiniteMode) {
		return timing.enable
	}

	return {
		while: '!.full'
	}
}

export function GetInfiniteModeForGrafik(
	engine: VizEngine,
	config: OffTubeShowstyleBlueprintConfig,
	parsedCue: CueDefinitionGrafik,
	isTlf?: boolean,
	isIdent?: boolean
): PieceLifespan {
	return engine === 'WALL'
		? PieceLifespan.Infinite
		: isTlf
		? PieceLifespan.OutOnNextPart
		: isIdent
		? PieceLifespan.OutOnNextSegment
		: parsedCue.end && parsedCue.end.infiniteMode
		? InfiniteMode(parsedCue.end.infiniteMode, PieceLifespan.Normal)
		: FindInfiniteModeFromConfig(config, parsedCue)
}

export function FindInfiniteModeFromConfig(
	config: OffTubeShowstyleBlueprintConfig,
	parsedCue: CueDefinitionGrafik
): PieceLifespan {
	if (config.showStyle.GFXTemplates) {
		const template = GetTemplateName(config, parsedCue)
		const conf = config.showStyle.GFXTemplates.find(cnf =>
			cnf.VizTemplate ? cnf.VizTemplate.toString().toUpperCase() === template.toUpperCase() : false
		)

		if (!conf) {
			return PieceLifespan.Normal
		}

		if (!conf.OutType || !conf.OutType.toString().length) {
			return PieceLifespan.Normal
		}

		const type = conf.OutType.toString().toUpperCase()

		if (type !== 'B' && type !== 'S' && type !== 'O') {
			return PieceLifespan.Normal
		}

		return InfiniteMode(type, PieceLifespan.Normal)
	}

	return PieceLifespan.Normal
}

function GetSourceLayerForGrafik(config: OffTubeShowstyleBlueprintConfig, name: string) {
	const conf = config.showStyle.GFXTemplates
		? config.showStyle.GFXTemplates.find(gfk => gfk.VizTemplate.toString() === name)
		: undefined

	if (!conf) {
		return OffTubeSourceLayer.PgmGraphicsOverlay
	}

	switch (conf.SourceLayer) {
		// TODO: When adding more sourcelayers
		// This is here to guard against bad user input
		case OffTubeSourceLayer.PgmGraphicsHeadline:
			return OffTubeSourceLayer.PgmGraphicsHeadline
		case OffTubeSourceLayer.PgmGraphicsIdent:
			return OffTubeSourceLayer.PgmGraphicsIdent
		case OffTubeSourceLayer.PgmGraphicsLower:
			return OffTubeSourceLayer.PgmGraphicsLower
		case OffTubeSourceLayer.PgmGraphicsOverlay:
			return OffTubeSourceLayer.PgmGraphicsOverlay
		case OffTubeSourceLayer.PgmGraphicsTLF:
			return OffTubeSourceLayer.PgmGraphicsTLF
		case OffTubeSourceLayer.PgmGraphicsTema:
			return OffTubeSourceLayer.PgmGraphicsTema
		case OffTubeSourceLayer.PgmGraphicsTop:
			return OffTubeSourceLayer.PgmGraphicsTop
		case OffTubeSourceLayer.WallGraphics:
			return OffTubeSourceLayer.WallGraphics
		default:
			return OffTubeSourceLayer.PgmGraphicsOverlay
	}
}

export function GetTimelineLayerForGrafik(config: OffTubeShowstyleBlueprintConfig, name: string) {
	const conf = config.showStyle.GFXTemplates
		? config.showStyle.GFXTemplates.find(gfk => gfk.VizTemplate.toString() === name)
		: undefined

	if (!conf) {
		return GraphicLLayer.GraphicLLayerOverlay
	}

	switch (conf.LayerMapping) {
		// TODO: When adding more output layers
		case GraphicLLayer.GraphicLLayerOverlayIdent:
			return GraphicLLayer.GraphicLLayerOverlayIdent
		case GraphicLLayer.GraphicLLayerOverlayTopt:
			return GraphicLLayer.GraphicLLayerOverlayTopt
		case GraphicLLayer.GraphicLLayerOverlayLower:
			return GraphicLLayer.GraphicLLayerOverlayLower
		case GraphicLLayer.GraphicLLayerOverlayHeadline:
			return GraphicLLayer.GraphicLLayerOverlayHeadline
		case GraphicLLayer.GraphicLLayerOverlayTema:
			return GraphicLLayer.GraphicLLayerOverlayTema
		case GraphicLLayer.GraphicLLayerWall:
			return GraphicLLayer.GraphicLLayerWall
		default:
			return GraphicLLayer.GraphicLLayerOverlay
	}
}

function grafikName(
	config: OffTubeShowstyleBlueprintConfig,
	parsedCue: CueDefinitionGrafik | CueDefinitionMOS
): string {
	if (parsedCue.type === CueType.Grafik) {
		return `${parsedCue.template ? `${GetTemplateName(config, parsedCue)}` : ''}${parsedCue.textFields
			.filter(txt => !txt.match(/^;.\.../i))
			.map(txt => ` - ${txt}`)}`.replace(/,/gi, '')
	} else {
		return `${parsedCue.name ? parsedCue.name : ''}`
	}
}

export function GetGrafikDuration(
	config: OffTubeShowstyleBlueprintConfig,
	cue: CueDefinitionGrafik | CueDefinitionMOS
): number | undefined {
	if (config.showStyle.GFXTemplates) {
		if (cue.type === CueType.Grafik) {
			const template = config.showStyle.GFXTemplates.find(templ =>
				templ.INewsName ? templ.INewsName.toString().toUpperCase() === cue.template.toUpperCase() : false
			)
			if (template) {
				if (template.OutType && !template.OutType.toString().match(/default/i)) {
					return undefined
				}
			}
		} else {
			const template = config.showStyle.GFXTemplates.find(templ =>
				templ.INewsName ? templ.INewsName.toString().toUpperCase() === cue.vcpid.toString().toUpperCase() : false
			)
			if (template) {
				if (template.OutType && !template.OutType.toString().match(/default/i)) {
					return undefined
				}
			}
		}
	}

	return GetDefaultOut(config)
}

function GetTemplateName(config: OffTubeShowstyleBlueprintConfig, cue: CueDefinitionGrafik): string {
	if (config.showStyle.GFXTemplates) {
		const template = config.showStyle.GFXTemplates.find(templ =>
			templ.INewsName ? templ.INewsName.toString().toUpperCase() === cue.template.toUpperCase() : false
		)
		if (template && template.VizTemplate.toString().length) {
			return template.VizTemplate.toString()
		}
	}

	// This means unconfigured templates will still be supported, with default out.
	return cue.template
}

function GetDefaultOut(config: OffTubeShowstyleBlueprintConfig): number {
	if (config.showStyle.DefaultTemplateDuration !== undefined) {
		return Number(config.showStyle.DefaultTemplateDuration) * 1000
	}

	return 4 * 1000
}