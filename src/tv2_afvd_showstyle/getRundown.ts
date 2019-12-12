import {
	AtemTransitionStyle,
	DeviceType,
	TimelineContentTypeAtem,
	TimelineContentTypeCasparCg,
	TimelineContentTypeSisyfos,
	TimelineContentTypeVizMSE,
	TimelineObjAtemAUX,
	TimelineObjAtemDSK,
	TimelineObjAtemME,
	TimelineObjAtemSsrc,
	TimelineObjAtemSsrcProps,
	TimelineObjCCGHTMLPage,
	TimelineObjCCGMedia,
	TimelineObjCCGRoute,
	TimelineObjSisyfosMessage,
	TimelineObjVIZMSEClearAllElements,
	TimelineObjVIZMSEElementContinue,
	TimelineObjVIZMSEElementInternal,
	TimelineObjVIZMSELoadAllElements,
	Transition,
	TSRTimelineObj,
	TSRTimelineObjBase
} from 'timeline-state-resolver-types'
import {
	BlueprintResultRundown,
	GraphicsContent,
	IBlueprintAdLibPiece,
	IBlueprintRundown,
	IBlueprintShowStyleVariant,
	IngestRundown,
	IStudioConfigContext,
	NotesContext,
	PieceLifespan,
	ShowStyleContext,
	SourceLayerType
} from 'tv-automation-sofie-blueprints-integration'
import * as _ from 'underscore'
import { literal } from '../common/util'
import { SourceInfo } from '../tv2_afvd_studio/helpers/sources'
import { AtemLLayer, CasparLLayer, SisyfosLLAyer, VizLLayer } from '../tv2_afvd_studio/layers'
import { TimelineBlueprintExt } from '../tv2_afvd_studio/onTimelineGenerate'
import { SisyfosChannel, sisyfosChannels } from '../tv2_afvd_studio/sisyfosChannels'
import { AtemSourceIndex } from '../types/atem'
import { CONSTANTS } from '../types/constants'
import { BlueprintConfig, parseConfig } from './helpers/config'
import { boxLayers, boxMappings, MakeContentDVE2 } from './helpers/content/dve'
import { GetSisyfosTimelineObjForCamera, GetSisyfosTimelineObjForEkstern, STUDIO_MICS } from './helpers/sisyfos/sisyfos'
import { ControlClasses, SourceLayer } from './layers'
import { postProcessPieceTimelineObjects } from './postProcessTimelineObjects'

export function getShowStyleVariantId(
	_context: IStudioConfigContext,
	showStyleVariants: IBlueprintShowStyleVariant[],
	_ingestRundown: IngestRundown
): string | null {
	const variant = _.first(showStyleVariants)
	if (variant) {
		return variant._id
	}
	return null
}

export function getRundown(context: ShowStyleContext, ingestRundown: IngestRundown): BlueprintResultRundown {
	const config = parseConfig(context)

	let startTime: number = 0
	let endTime: number = 0

	// Set start / end times
	if ('payload' in ingestRundown) {
		if (ingestRundown.payload.expectedStart) {
			startTime = Number(ingestRundown.payload.expectedStart)
		}

		if (ingestRundown.payload.expectedEnd) {
			endTime = Number(ingestRundown.payload.expectedEnd)
		}
	}

	// Can't end before we begin
	if (endTime < startTime) {
		endTime = startTime
	}

	return {
		rundown: literal<IBlueprintRundown>({
			externalId: ingestRundown.externalId,
			name: ingestRundown.name,
			expectedStart: startTime,
			expectedDuration: endTime - startTime
		}),
		globalAdLibPieces: getGlobalAdLibPieces(context, config),
		baseline: getBaseline(config)
	}
}

function getGlobalAdLibPieces(context: NotesContext, config: BlueprintConfig): IBlueprintAdLibPiece[] {
	function makeSsrcAdlibBoxes(layer: SourceLayer, port: number) {
		// Generate boxes with classes to map across each layer
		const boxObjs = _.map(boxMappings, (m, i) =>
			literal<TimelineObjAtemSsrc & TimelineBlueprintExt>({
				id: '',
				enable: { while: `.${layer}_${m}` },
				priority: 1,
				layer: m,
				content: {
					deviceType: DeviceType.ATEM,
					type: TimelineContentTypeAtem.SSRC,
					ssrc: {
						boxes: [
							// Pad until we are on the right box
							..._.range(i).map(() => ({})),
							// Add the source setter
							{ source: port }
						]
					}
				},
				metaData: {
					dveAdlibEnabler: `.${layer}_${m} & !.${ControlClasses.DVEOnAir}`
				}
			})
		)
		const audioWhile = boxObjs.map(obj => obj.enable.while as string).join(' | ')
		return {
			boxObjs,
			audioWhile: `(\$${SourceLayer.PgmDVE} | \$${SourceLayer.PgmDVEAdlib}) & (${audioWhile})`
		}
	}
	function makeCameraAdLibs(info: SourceInfo, rank: number, preview: boolean = false): IBlueprintAdLibPiece[] {
		const res: IBlueprintAdLibPiece[] = []
		res.push({
			externalId: 'cam',
			name: info.id + '',
			_rank: rank,
			sourceLayerId: SourceLayer.PgmCam,
			outputLayerId: 'pgm',
			expectedDuration: 0,
			infiniteMode: PieceLifespan.OutOnNextPart,
			toBeQueued: preview,
			content: {
				timelineObjects: _.compact<TSRTimelineObj>([
					literal<TimelineObjAtemME>({
						id: '',
						enable: { while: '1' },
						priority: 1,
						layer: AtemLLayer.AtemMEProgram,
						content: {
							deviceType: DeviceType.ATEM,
							type: TimelineContentTypeAtem.ME,
							me: {
								input: info.port,
								transition: AtemTransitionStyle.CUT
							}
						}
					}),
					...GetSisyfosTimelineObjForCamera(`Kamera ${info.id}`)
				])
			}
		})
		return res
	}

	// ssrc box
	function makeCameraAdlibBoxes(info: SourceInfo, rank: number): IBlueprintAdLibPiece[] {
		const res: IBlueprintAdLibPiece[] = []
		_.forEach(_.values(boxLayers), (layer: SourceLayer, i) => {
			const { boxObjs, audioWhile } = makeSsrcAdlibBoxes(layer, info.port)

			res.push({
				externalId: 'cam',
				name: info.id + '',
				_rank: rank * 100 + i,
				sourceLayerId: layer,
				outputLayerId: 'pgm', // TODO
				expectedDuration: 0,
				infiniteMode: PieceLifespan.OutOnNextPart,
				content: {
					timelineObjects: _.compact<TSRTimelineObj>([
						...boxObjs,
						...GetSisyfosTimelineObjForCamera(`Kamera ${info.id}`, { while: audioWhile })
					])
				}
			})
		})
		return res
	}

	function makeRemoteAdLibs(info: SourceInfo, rank: number): IBlueprintAdLibPiece[] {
		const res: IBlueprintAdLibPiece[] = []
		res.push({
			externalId: 'live',
			name: info.id + '',
			_rank: rank,
			sourceLayerId: SourceLayer.PgmLive,
			outputLayerId: 'pgm',
			expectedDuration: 0,
			infiniteMode: PieceLifespan.OutOnNextPart,
			toBeQueued: true,
			content: {
				timelineObjects: _.compact<TSRTimelineObj>([
					literal<TimelineObjAtemME>({
						id: '',
						enable: { while: '1' },
						priority: 1,
						layer: AtemLLayer.AtemMEProgram,
						content: {
							deviceType: DeviceType.ATEM,
							type: TimelineContentTypeAtem.ME,
							me: {
								input: info.port,
								transition: AtemTransitionStyle.CUT
							}
						}
					}),
					...GetSisyfosTimelineObjForEkstern(context, `Live ${info.id}`),
					...GetSisyfosTimelineObjForCamera('telefon')
				])
			}
		})

		return res
	}

	// ssrc box
	function makeRemoteAdlibBoxes(info: SourceInfo, rank: number): IBlueprintAdLibPiece[] {
		const res: IBlueprintAdLibPiece[] = []
		_.forEach(_.values(boxLayers), (layer: SourceLayer, i) => {
			const { boxObjs, audioWhile } = makeSsrcAdlibBoxes(layer, info.port)

			res.push({
				externalId: 'cam',
				name: info.id + '',
				_rank: rank * 100 + i,
				sourceLayerId: layer,
				outputLayerId: 'pgm', // TODO
				expectedDuration: 0,
				infiniteMode: PieceLifespan.OutOnNextPart,
				content: {
					timelineObjects: _.compact<TSRTimelineObj>([
						...boxObjs,
						...GetSisyfosTimelineObjForEkstern(context, `Live ${info.id}`, { while: audioWhile }),
						...GetSisyfosTimelineObjForCamera('telefon', { while: audioWhile })
					])
				}
			})
		})
		return res
	}

	const adlibItems: IBlueprintAdLibPiece[] = []

	let globalRank = 1000

	config.sources
		.filter(u => u.type === SourceLayerType.CAMERA)
		.slice(0, 5) // the first x cameras to create INP1/2/3 cam-adlibs from
		.forEach(o => {
			adlibItems.push(...makeCameraAdLibs(o, globalRank++))
		})

	config.sources
		.filter(u => u.type === SourceLayerType.CAMERA)
		.slice(0, 5) // the first x cameras to create preview cam-adlibs from
		.forEach(o => {
			adlibItems.push(...makeCameraAdLibs(o, globalRank++, true))
		})

	config.sources
		.filter(u => u.type === SourceLayerType.CAMERA)
		.slice(0, 5) // the first x cameras to create INP1/2/3 cam-adlibs from
		.forEach(o => {
			adlibItems.push(...makeCameraAdlibBoxes(o, globalRank++))
		})

	config.sources
		.filter(u => u.type === SourceLayerType.REMOTE)
		.slice(0, 10) // the first x cameras to create live-adlibs from
		.forEach(o => {
			adlibItems.push(...makeRemoteAdLibs(o, globalRank++))
		})

	config.sources
		.filter(u => u.type === SourceLayerType.REMOTE)
		.slice(0, 10) // the first x cameras to create INP1/2/3 live-adlibs from
		.forEach(o => {
			adlibItems.push(...makeRemoteAdlibBoxes(o, globalRank++))
		})

	adlibItems.push({
		externalId: 'delayed',
		name: `Delayed Playback`,
		_rank: 1500,
		sourceLayerId: SourceLayer.PgmCam,
		outputLayerId: 'pgm',
		expectedDuration: 0,
		infiniteMode: PieceLifespan.OutOnNextPart,
		content: {
			timelineObjects: _.compact<TSRTimelineObj>([
				literal<TimelineObjAtemME>({
					id: '',
					enable: { while: '1' },
					priority: 1,
					layer: AtemLLayer.AtemMEProgram,
					content: {
						deviceType: DeviceType.ATEM,
						type: TimelineContentTypeAtem.ME,
						me: {
							input: config.studio.AtemSource.DelayedPlayback,
							transition: AtemTransitionStyle.CUT
						}
					}
				})
			])
		}
	})

	// the rank (order) of adlibs on SourceLayer.PgmAdlibVizCmd is important, to ensure keyboard shortcuts
	adlibItems.push({
		externalId: 'loadGFX',
		name: 'OVL INIT',
		_rank: 100,
		sourceLayerId: SourceLayer.PgmAdlibVizCmd,
		outputLayerId: 'sec',
		expectedDuration: 1000,
		infiniteMode: PieceLifespan.Normal,
		content: {
			timelineObjects: _.compact<TSRTimelineObj>([
				literal<TimelineObjVIZMSELoadAllElements>({
					id: 'loadAllElements',
					enable: {
						start: 0,
						duration: 1000
					},
					priority: 100,
					layer: VizLLayer.VizLLayerAdLibs,
					content: {
						deviceType: DeviceType.VIZMSE,
						type: TimelineContentTypeVizMSE.LOAD_ALL_ELEMENTS
					}
				})
			])
		}
	})
	// the rank (order) of adlibs on SourceLayer.PgmAdlibVizCmd is important, to ensure keyboard shortcuts
	adlibItems.push({
		externalId: 'continueForward',
		name: 'GFX Continue',
		_rank: 200,
		sourceLayerId: SourceLayer.PgmAdlibVizCmd,
		outputLayerId: 'sec',
		expectedDuration: 1000,
		infiniteMode: PieceLifespan.Normal,
		content: {
			timelineObjects: _.compact<TSRTimelineObj>([
				literal<TimelineObjVIZMSEElementContinue>({
					id: '',
					enable: {
						start: 0,
						duration: 1000
					},
					priority: 100,
					layer: VizLLayer.VizLLayerAdLibs,
					content: {
						deviceType: DeviceType.VIZMSE,
						type: TimelineContentTypeVizMSE.CONTINUE,
						direction: 1,
						reference: VizLLayer.VizLLayerPilot
					}
				})
			])
		}
	})
	// the rank (order) of adlibs on SourceLayer.PgmAdlibVizCmd is important, to ensure keyboard shortcuts
	adlibItems.push({
		externalId: 'clearAllGFX',
		name: 'GFX Clear',
		_rank: 300,
		sourceLayerId: SourceLayer.PgmAdlibVizCmd,
		outputLayerId: 'sec',
		expectedDuration: 2000,
		infiniteMode: PieceLifespan.Normal,
		content: {
			timelineObjects: _.compact<TSRTimelineObj>([
				literal<TimelineObjVIZMSEClearAllElements>({
					id: '',
					enable: {
						start: 1000,
						duration: 1000
					},
					priority: 100,
					layer: VizLLayer.VizLLayerAdLibs,
					content: {
						deviceType: DeviceType.VIZMSE,
						type: TimelineContentTypeVizMSE.CLEAR_ALL_ELEMENTS
					}
				})
			])
		}
	})
	// the rank (order) of adlibs on SourceLayer.PgmAdlibVizCmd is important, to ensure keyboard shortcuts
	// disabled since TV 2 says this doesn't work
	// adlibItems.push({
	// 	externalId: 'continueReverse',
	// 	name: 'GFX Reverse',
	// 	_rank: 300,
	// 	sourceLayerId: SourceLayer.PgmAdlibVizCmd,
	// 	outputLayerId: 'sec',
	// 	expectedDuration: 1000,
	// 	infiniteMode: PieceLifespan.Normal,
	// 	content: {
	// 		timelineObjects: _.compact<TSRTimelineObj>([
	// 			literal<TimelineObjVIZMSEElementContinue>({
	// 				id: '',
	// 				enable: {
	// 					start: 0,
	// 					duration: 1000
	// 				},
	// 				layer: VizLLayer.VizLLayerAdLibs,
	// 				content: {
	// 					deviceType: DeviceType.VIZMSE,
	// 					type: TimelineContentTypeVizMSE.CONTINUE,
	// 					direction: -1,
	// 					reference: VizLLayer.VizLLayerPilot
	// 				}
	// 			})
	// 		])
	// 	}
	// })
	// the rank (order) of adlibs on SourceLayer.PgmAdlibVizCmd is important, to ensure keyboard shortcuts
	adlibItems.push({
		externalId: 'dskoff',
		name: 'DSK OFF',
		_rank: 400,
		sourceLayerId: SourceLayer.PgmDSK,
		outputLayerId: 'sec',
		infiniteMode: PieceLifespan.Infinite,
		content: {
			timelineObjects: _.compact<TSRTimelineObj>([
				literal<TimelineObjAtemDSK>({
					id: '',
					enable: { while: '1' },
					priority: 10,
					layer: AtemLLayer.AtemDSKGraphics,
					content: {
						deviceType: DeviceType.ATEM,
						type: TimelineContentTypeAtem.DSK,
						dsk: {
							onAir: false
						}
					}
				})
			])
		}
	})

	adlibItems.push({
		externalId: 'micUp',
		name: 'Mics Up',
		_rank: 500,
		sourceLayerId: SourceLayer.PgmSisyfosAdlibs,
		outputLayerId: 'sec',
		infiniteMode: PieceLifespan.Infinite,
		expectedDuration: 0,
		content: {
			timelineObjects: _.compact<TSRTimelineObj>([
				...STUDIO_MICS.map<TimelineObjSisyfosMessage>(layer => {
					return literal<TimelineObjSisyfosMessage>({
						id: '',
						enable: { start: 0 },
						priority: 1,
						layer,
						content: {
							deviceType: DeviceType.SISYFOS,
							type: TimelineContentTypeSisyfos.SISYFOS,
							isPgm: 1
						}
					})
				})
			])
		}
	})

	adlibItems.push({
		externalId: 'micDown',
		name: 'Mics Down',
		_rank: 550,
		sourceLayerId: SourceLayer.PgmSisyfosAdlibs,
		outputLayerId: 'sec',
		infiniteMode: PieceLifespan.Infinite,
		expectedDuration: 0,
		content: {
			timelineObjects: _.compact<TSRTimelineObj>([
				...STUDIO_MICS.map<TimelineObjSisyfosMessage>(layer => {
					return literal<TimelineObjSisyfosMessage>({
						id: '',
						enable: { start: 0 },
						priority: 1,
						layer,
						content: {
							deviceType: DeviceType.SISYFOS,
							type: TimelineContentTypeSisyfos.SISYFOS,
							isPgm: 0
						}
					})
				})
			])
		}
	})

	_.each(config.showStyle.DVEStyles, (dveConfig, i) => {
		// const boxSources = ['', '', '', '']
		const content = MakeContentDVE2(context, config, dveConfig, {}, undefined)

		if (content.valid) {
			adlibItems.push({
				externalId: `dve-${dveConfig.DVEName}`,
				name: (dveConfig.DVEName || 'DVE') + '',
				_rank: 200 + i,
				sourceLayerId: SourceLayer.PgmDVEAdlib,
				outputLayerId: 'pgm',
				expectedDuration: 0,
				infiniteMode: PieceLifespan.OutOnNextPart,
				toBeQueued: true,
				content: content.content,
				adlibPreroll: Number(config.studio.CasparPrerollDuration) || 0
			})
		}
	})

	// viz styles and dve backgrounds
	adlibItems.push(
		literal<IBlueprintAdLibPiece>({
			_rank: 301,
			externalId: 'dve-design-sc',
			name: 'DVE Design SC',
			outputLayerId: 'sec',
			sourceLayerId: SourceLayer.PgmDesign,
			infiniteMode: PieceLifespan.Infinite,
			content: literal<GraphicsContent>({
				fileName: 'BG_LOADER_SC',
				path: 'BG_LOADER_SC',
				timelineObjects: _.compact<TSRTimelineObj>([
					literal<TimelineObjVIZMSEElementInternal>({
						id: '',
						enable: { start: 0 },
						priority: 110,
						layer: VizLLayer.VizLLayerDesign,
						content: {
							deviceType: DeviceType.VIZMSE,
							type: TimelineContentTypeVizMSE.ELEMENT_INTERNAL,
							templateName: 'BG_LOADER_SC',
							templateData: []
						}
					}),
					literal<TimelineObjCCGMedia>({
						id: '',
						enable: { start: 0 },
						priority: 110,
						layer: CasparLLayer.CasparCGDVELoop,
						content: {
							deviceType: DeviceType.CASPARCG,
							type: TimelineContentTypeCasparCg.MEDIA,
							file: 'dve/BG_LOADER_SC',
							loop: true
						}
					})
				])
			})
		})
	)

	adlibItems.forEach(p => postProcessPieceTimelineObjects(context, config, p))
	return adlibItems
}

function getBaseline(config: BlueprintConfig): TSRTimelineObjBase[] {
	return [
		// Default timeline
		literal<TimelineObjAtemME>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemMEProgram,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.ME,
				me: {
					input: config.studio.AtemSource.Default,
					transition: AtemTransitionStyle.CUT
				}
			}
		}),
		literal<TimelineObjAtemME>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemMEClean,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.ME,
				me: {
					input: config.studio.AtemSource.Default,
					transition: AtemTransitionStyle.CUT
				}
			}
		}),

		// route default outputs
		literal<TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxPGM,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.AUX,
				aux: {
					input: AtemSourceIndex.Prg1
				}
			}
		}),
		literal<TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxClean,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.AUX,
				aux: {
					input: AtemSourceIndex.Prg4
				}
			}
		}),
		literal<TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxLookahead,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.AUX,
				aux: {
					input: config.studio.AtemSource.Default
				}
			}
		}),
		literal<TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxSSrc,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.AUX,
				aux: {
					input: AtemSourceIndex.SSrc
				}
			}
		}),
		literal<TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxVideoMixMinus,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.AUX,
				aux: {
					input: config.studio.AtemSource.MixMinusDefault
				}
			}
		}),

		// render presenter screen
		literal<TimelineObjCCGHTMLPage>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCountdown,
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.HTMLPAGE,
				url: config.studio.SofieHostURL + '/countdowns/studio0/presenter'
			}
		}),

		// keyers
		literal<TimelineObjAtemDSK>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemDSKGraphics,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.DSK,
				dsk: {
					onAir: true,
					sources: {
						fillSource: config.studio.AtemSource.DSK1F,
						cutSource: config.studio.AtemSource.DSK1K
					},
					properties: {
						tie: false,
						preMultiply: false,
						clip: config.studio.AtemSettings.VizClip * 10, // input is percents (0-100), atem uses 1-000,
						gain: config.studio.AtemSettings.VizGain * 10, // input is percents (0-100), atem uses 1-000,
						mask: {
							enabled: false
						}
					}
				}
			}
		}),
		literal<TimelineObjAtemDSK>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemDSKEffect,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.DSK,
				dsk: {
					onAir: false,
					sources: {
						fillSource: config.studio.AtemSource.JingleFill,
						cutSource: config.studio.AtemSource.JingleKey
					},
					properties: {
						tie: false,
						preMultiply: false,
						clip: config.studio.AtemSettings.CCGClip * 10, // input is percents (0-100), atem uses 1-000,
						gain: config.studio.AtemSettings.CCGGain * 10, // input is percents (0-100), atem uses 1-000,
						mask: {
							enabled: false
						}
					}
				}
			}
		}),
		// slaves the DSK2 for jingles to ME4 USK1 to have effects on CLEAN (ME4)
		literal<TimelineObjAtemME>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemCleanUSKEffect,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.ME,
				me: {
					upstreamKeyers: [
						{
							upstreamKeyerId: 0,
							onAir: false,
							mixEffectKeyType: 0,
							flyEnabled: false,
							fillSource: config.studio.AtemSource.JingleFill,
							cutSource: config.studio.AtemSource.JingleKey,
							maskEnabled: false,
							lumaSettings: {
								preMultiplied: false,
								clip: config.studio.AtemSettings.CCGClip * 10, // input is percents (0-100), atem uses 1-000
								gain: config.studio.AtemSettings.CCGGain * 10 // input is percents (0-100), atem uses 1-000
							}
						}
					]
				}
			}
		}),
		literal<TimelineObjAtemSsrcProps>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemSSrcArt,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.SSRCPROPS,
				ssrcProps: {
					artFillSource: config.studio.AtemSource.SplitArtF,
					artCutSource: config.studio.AtemSource.SplitArtK,
					artOption: 1, // foreground
					artPreMultiplied: true
				}
			}
		}),
		literal<TimelineObjAtemSsrc>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemSSrcDefault,
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.SSRC,
				ssrc: {
					boxes: [
						{
							// left
							enabled: true,
							source: AtemSourceIndex.Bars,
							size: 580,
							x: -800,
							y: 50,
							cropped: true,
							cropRight: 2000
						},
						{
							// right
							enabled: true,
							source: AtemSourceIndex.Bars,
							size: 580,
							x: 800,
							y: 50
							// note: this sits behind box1, so don't crop it to ensure there is no gap between
						},
						{
							// box 3
							enabled: false
						},
						{
							// box 4
							enabled: false
						}
					]
				}
			}
		}),
		literal<TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGDVEFrame,
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.MEDIA,
				file: 'empty',
				mixer: {
					opacity: 0
				},
				transitions: {
					inTransition: {
						type: Transition.CUT,
						duration: CONSTANTS.DefaultClipFadeOut
					}
				}
			}
		}),
		literal<TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGDVEKey,
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.MEDIA,
				file: 'empty',
				mixer: {
					opacity: 0
				},
				transitions: {
					inTransition: {
						type: Transition.CUT,
						duration: CONSTANTS.DefaultClipFadeOut
					}
				}
			}
		}),
		literal<TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGDVETemplate,
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.MEDIA,
				file: 'empty',
				mixer: {
					opacity: 0
				},
				transitions: {
					inTransition: {
						type: Transition.CUT,
						duration: CONSTANTS.DefaultClipFadeOut
					}
				}
			}
		}),
		literal<TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGDVELoop,
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.MEDIA,
				file: 'empty',
				transitions: {
					inTransition: {
						type: Transition.CUT,
						duration: CONSTANTS.DefaultClipFadeOut
					}
				}
			}
		}),
		literal<TimelineObjCCGRoute>({
			id: '',
			enable: { while: 1 },
			priority: 0,
			layer: CasparLLayer.CasparCGFullBg,
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.ROUTE,
				mappedLayer: CasparLLayer.CasparCGDVELoop
			}
		}),

		// create sisyfos channels from the config
		...Object.keys(sisyfosChannels).map(key => {
			const llayer = key as SisyfosLLAyer
			const channel = sisyfosChannels[llayer] as SisyfosChannel
			return literal<TimelineObjSisyfosMessage>({
				id: '',
				enable: { while: '1' },
				priority: 0,
				layer: llayer,
				content: {
					deviceType: DeviceType.SISYFOS,
					type: TimelineContentTypeSisyfos.SISYFOS,
					isPgm: channel.isPgm,
					visible: !channel.hideInStudioA,
					label: channel.label
				}
			})
		}),

		literal<TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGLYD,
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.MEDIA,
				loop: true,
				file: 'EMPTY',
				mixer: {
					volume: 0
				}
			}
		})
	]
}
