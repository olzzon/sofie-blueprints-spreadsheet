import {
	BlueprintResultRundown,
	GraphicsContent,
	IBlueprintActionManifest,
	IBlueprintAdLibPiece,
	IBlueprintRundown,
	IBlueprintShowStyleVariant,
	IngestRundown,
	IStudioConfigContext,
	NotesContext,
	PieceLifespan,
	ShowStyleContext,
	SourceLayerType,
	TSR
} from '@sofie-automation/blueprints-integration'
import {
	ActionClearGraphics,
	ActionCutSourceToBox,
	ActionCutToCamera,
	ActionRecallLastDVE,
	ActionRecallLastLive,
	ActionSelectDVELayout,
	CreateLYDBaseline,
	GetEksternMetaData,
	GetLayersForEkstern,
	GetSisyfosTimelineObjForCamera,
	GetSisyfosTimelineObjForEkstern,
	GetTransitionAdLibActions,
	literal,
	pgmDSKLayers,
	SourceInfo,
	TimelineBlueprintExt
} from 'tv2-common'
import { AdlibActionType, AdlibTags, CONSTANTS, GraphicLLayer, SharedOutputLayers, TallyTags } from 'tv2-constants'
import * as _ from 'underscore'
import {
	AtemLLayer,
	atemLLayersDSK,
	CasparLLayer,
	CasparPlayerClipLoadingLoop,
	SisyfosLLAyer
} from '../tv2_afvd_studio/layers'
import { SisyfosChannel, sisyfosChannels } from '../tv2_afvd_studio/sisyfosChannels'
import { AtemSourceIndex } from '../types/atem'
import { BlueprintConfig, getConfig } from './helpers/config'
import { boxLayers } from './helpers/content/dve'
import { SourceLayer } from './layers'
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
	const config = getConfig(context)

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
		globalAdLibPieces: getGlobalAdLibPiecesAFKD(context, config),
		globalActions: getGlobalAdlibActionsAFVD(context, config),
		baseline: getBaseline(config)
	}
}

function getGlobalAdLibPiecesAFKD(context: NotesContext, config: BlueprintConfig): IBlueprintAdLibPiece[] {
	function makeEVSAdLibs(info: SourceInfo, rank: number, vo: boolean): IBlueprintAdLibPiece[] {
		const res: IBlueprintAdLibPiece[] = []
		res.push({
			externalId: 'delayed',
			name: `EVS ${info.id.replace(/dp/i, '')}${vo ? ' VO' : ''}`,
			_rank: rank,
			sourceLayerId: SourceLayer.PgmLocal,
			outputLayerId: SharedOutputLayers.PGM,
			expectedDuration: 0,
			lifespan: PieceLifespan.WithinPart,
			toBeQueued: true,
			metaData: GetEksternMetaData(config.stickyLayers, config.studio.StudioMics, info.sisyfosLayers),
			content: {
				ignoreMediaObjectStatus: true,
				timelineObjects: _.compact<TSR.TSRTimelineObj>([
					literal<TSR.TimelineObjAtemME>({
						id: '',
						enable: { while: '1' },
						priority: 1,
						layer: AtemLLayer.AtemMEProgram,
						content: {
							deviceType: TSR.DeviceType.ATEM,
							type: TSR.TimelineContentTypeAtem.ME,
							me: {
								input: info.port,
								transition: TSR.AtemTransitionStyle.CUT
							}
						},
						classes: ['adlib_deparent']
					}),
					...(info.sisyfosLayers || []).map(l => {
						return literal<TSR.TimelineObjSisyfosChannel>({
							id: '',
							enable: { while: '1' },
							priority: 1,
							layer: l,
							content: {
								deviceType: TSR.DeviceType.SISYFOS,
								type: TSR.TimelineContentTypeSisyfos.CHANNEL,
								isPgm: vo ? 2 : 1
							}
						})
					}),
					literal<TSR.TimelineObjSisyfosChannels & TimelineBlueprintExt>({
						id: '',
						enable: {
							start: 0
						},
						priority: 1,
						layer: SisyfosLLAyer.SisyfosPersistedLevels,
						content: {
							deviceType: TSR.DeviceType.SISYFOS,
							type: TSR.TimelineContentTypeSisyfos.CHANNELS,
							overridePriority: 1,
							channels: config.stickyLayers
								.filter(layer => !info.sisyfosLayers || !info.sisyfosLayers.includes(layer))
								.map<TSR.TimelineObjSisyfosChannels['content']['channels'][0]>(layer => {
									return {
										mappedLayer: layer,
										isPgm: 0
									}
								})
						},
						metaData: {
							sisyfosPersistLevel: true
						}
					}),
					GetSisyfosTimelineObjForCamera(context, config, 'evs', SisyfosLLAyer.SisyfosGroupStudioMics)
				])
			}
		})

		return res
	}

	function makeRemoteAdLibs(info: SourceInfo, rank: number): IBlueprintAdLibPiece[] {
		const res: IBlueprintAdLibPiece[] = []
		const eksternSisyfos = [
			...GetSisyfosTimelineObjForEkstern(context, config.sources, `Live ${info.id}`, GetLayersForEkstern),
			GetSisyfosTimelineObjForCamera(context, config, 'telefon', SisyfosLLAyer.SisyfosGroupStudioMics)
		]
		res.push({
			externalId: 'live',
			name: `LIVE ${info.id}`,
			_rank: rank,
			sourceLayerId: SourceLayer.PgmLive,
			outputLayerId: SharedOutputLayers.PGM,
			expectedDuration: 0,
			lifespan: PieceLifespan.WithinPart,
			toBeQueued: true,
			metaData: GetEksternMetaData(
				config.stickyLayers,
				config.studio.StudioMics,
				GetLayersForEkstern(context, config.sources, `Live ${info.id}`)
			),
			content: {
				timelineObjects: _.compact<TSR.TSRTimelineObj>([
					literal<TSR.TimelineObjAtemME>({
						id: '',
						enable: { while: '1' },
						priority: 1,
						layer: AtemLLayer.AtemMEProgram,
						content: {
							deviceType: TSR.DeviceType.ATEM,
							type: TSR.TimelineContentTypeAtem.ME,
							me: {
								input: info.port,
								transition: TSR.AtemTransitionStyle.CUT
							}
						},
						classes: ['adlib_deparent']
					}),
					...eksternSisyfos,
					literal<TSR.TimelineObjSisyfosChannels & TimelineBlueprintExt>({
						id: '',
						enable: {
							start: 0
						},
						priority: 1,
						layer: SisyfosLLAyer.SisyfosPersistedLevels,
						content: {
							deviceType: TSR.DeviceType.SISYFOS,
							type: TSR.TimelineContentTypeSisyfos.CHANNELS,
							overridePriority: 1,
							channels: config.stickyLayers
								.filter(layer => eksternSisyfos.map(obj => obj.layer).indexOf(layer) === -1)
								.filter(layer => config.liveAudio.indexOf(layer) === -1)
								.map(layer => {
									return literal<TSR.TimelineObjSisyfosChannels['content']['channels'][0]>({
										mappedLayer: layer,
										isPgm: 0
									})
								})
						},
						metaData: {
							sisyfosPersistLevel: true
						}
					}),
					// Force server to be muted (for adlibbing over DVE)
					...[
						SisyfosLLAyer.SisyfosSourceClipPending,
						SisyfosLLAyer.SisyfosSourceServerA,
						SisyfosLLAyer.SisyfosSourceServerB
					].map<TSR.TimelineObjSisyfosChannel>(layer => {
						return literal<TSR.TimelineObjSisyfosChannel>({
							id: '',
							enable: {
								start: 0
							},
							priority: 2,
							layer,
							content: {
								deviceType: TSR.DeviceType.SISYFOS,
								type: TSR.TimelineContentTypeSisyfos.CHANNEL,
								isPgm: 0
							}
						})
					})
				])
			}
		})

		return res
	}

	// aux adlibs
	function makeRemoteAuxStudioAdLibs(info: SourceInfo, rank: number): IBlueprintAdLibPiece[] {
		const res: IBlueprintAdLibPiece[] = []
		res.push({
			externalId: 'auxstudio',
			name: info.id + '',
			_rank: rank,
			sourceLayerId: SourceLayer.AuxStudioScreen,
			outputLayerId: SharedOutputLayers.AUX,
			expectedDuration: 0,
			lifespan: PieceLifespan.OutOnRundownEnd,
			metaData: GetEksternMetaData(
				config.stickyLayers,
				config.studio.StudioMics,
				GetLayersForEkstern(context, config.sources, `Live ${info.id}`)
			),
			content: {
				timelineObjects: _.compact<TSR.TSRTimelineObj>([
					literal<TSR.TimelineObjAtemAUX>({
						id: '',
						enable: { while: '1' },
						priority: 1,
						layer: AtemLLayer.AtemAuxAR,
						content: {
							deviceType: TSR.DeviceType.ATEM,
							type: TSR.TimelineContentTypeAtem.AUX,
							aux: {
								input: info.port
							}
						}
					})
				])
			}
		})

		return res
	}

	const adlibItems: IBlueprintAdLibPiece[] = []

	let globalRank = 1000

	config.sources
		.filter(u => u.type === SourceLayerType.REMOTE)
		.slice(0, 10) // the first x cameras to create live-adlibs from
		.forEach(o => {
			adlibItems.push(...makeRemoteAdLibs(o, globalRank++))
		})

	config.sources
		.filter(u => u.type === SourceLayerType.REMOTE)
		.slice(0, 10) // the first x lives to create AUX1 (studio) adlibs
		.forEach(o => {
			adlibItems.push(...makeRemoteAuxStudioAdLibs(o, globalRank++))
		})

	config.sources
		.filter(u => u.type === SourceLayerType.LOCAL)
		.forEach(o => {
			adlibItems.push(...makeEVSAdLibs(o, globalRank++, false))
			adlibItems.push(...makeEVSAdLibs(o, globalRank++, true))
			adlibItems.push({
				externalId: 'delayedaux',
				name: `EVS in studio aux`,
				_rank: globalRank++,
				sourceLayerId: SourceLayer.AuxStudioScreen,
				outputLayerId: SharedOutputLayers.AUX,
				expectedDuration: 0,
				lifespan: PieceLifespan.OutOnRundownEnd,
				content: {
					timelineObjects: _.compact<TSR.TSRTimelineObj>([
						literal<TSR.TimelineObjAtemAUX>({
							id: '',
							enable: { while: '1' },
							priority: 1,
							layer: AtemLLayer.AtemAuxAR,
							content: {
								deviceType: TSR.DeviceType.ATEM,
								type: TSR.TimelineContentTypeAtem.AUX,
								aux: {
									input: o.port
								}
							}
						})
					])
				}
			})
			adlibItems.push({
				externalId: 'delayedaux',
				name: `EVS in viz aux`,
				_rank: globalRank++,
				sourceLayerId: SourceLayer.VizFullIn1,
				outputLayerId: SharedOutputLayers.AUX,
				expectedDuration: 0,
				lifespan: PieceLifespan.OutOnRundownEnd,
				content: {
					timelineObjects: _.compact<TSR.TSRTimelineObj>([
						literal<TSR.TimelineObjAtemAUX>({
							id: '',
							enable: { while: '1' },
							priority: 1,
							layer: AtemLLayer.AtemAuxVizOvlIn1,
							content: {
								deviceType: TSR.DeviceType.ATEM,
								type: TSR.TimelineContentTypeAtem.AUX,
								aux: {
									input: o.port
								}
							}
						})
					])
				}
			})
		})

	// the rank (order) of adlibs on SourceLayer.PgmAdlibVizCmd is important, to ensure keyboard shortcuts
	adlibItems.push({
		externalId: 'loadGFX',
		name: 'OVL INIT',
		_rank: 100,
		sourceLayerId: SourceLayer.PgmAdlibGraphicCmd,
		outputLayerId: SharedOutputLayers.SEC,
		expectedDuration: 1000,
		lifespan: PieceLifespan.WithinPart,
		tags: [AdlibTags.ADLIB_STATIC_BUTTON],
		content: {
			timelineObjects: _.compact<TSR.TSRTimelineObj>([
				literal<TSR.TimelineObjVIZMSELoadAllElements>({
					id: 'loadAllElements',
					enable: {
						start: 0,
						duration: 1000
					},
					priority: 100,
					layer: GraphicLLayer.GraphicLLayerAdLibs,
					content: {
						deviceType: TSR.DeviceType.VIZMSE,
						type: TSR.TimelineContentTypeVizMSE.LOAD_ALL_ELEMENTS
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
		sourceLayerId: SourceLayer.PgmAdlibGraphicCmd,
		outputLayerId: SharedOutputLayers.SEC,
		expectedDuration: 1000,
		lifespan: PieceLifespan.WithinPart,
		tags: [AdlibTags.ADLIB_STATIC_BUTTON],
		content: {
			timelineObjects: _.compact<TSR.TSRTimelineObj>([
				literal<TSR.TimelineObjVIZMSEElementContinue>({
					id: '',
					enable: {
						start: 0,
						duration: 1000
					},
					priority: 100,
					layer: GraphicLLayer.GraphicLLayerAdLibs,
					content: {
						deviceType: TSR.DeviceType.VIZMSE,
						type: TSR.TimelineContentTypeVizMSE.CONTINUE,
						direction: 1,
						reference: GraphicLLayer.GraphicLLayerPilot
					}
				})
			])
		}
	})

	// the rank (order) of adlibs on SourceLayer.PgmAdlibVizCmd is important, to ensure keyboard shortcuts
	for (const dsk of Object.values(config.dsk)) {
		if (dsk.Toggle && pgmDSKLayers[dsk.Number] && atemLLayersDSK[dsk.Number]) {
			if (dsk.DefaultOn) {
				adlibItems.push({
					externalId: `dskoff${dsk.Number}`,
					name: `DSK ${dsk.Number} OFF`,
					_rank: 500 + dsk.Number,
					sourceLayerId: pgmDSKLayers[dsk.Number],
					outputLayerId: SharedOutputLayers.SEC,
					lifespan: PieceLifespan.OutOnRundownEnd,
					tags: [AdlibTags.ADLIB_STATIC_BUTTON],
					content: {
						timelineObjects: _.compact<TSR.TSRTimelineObj>([
							literal<TSR.TimelineObjAtemDSK>({
								id: '',
								enable: { while: '1' },
								priority: 10,
								layer: atemLLayersDSK[dsk.Number],
								content: {
									deviceType: TSR.DeviceType.ATEM,
									type: TSR.TimelineContentTypeAtem.DSK,
									dsk: {
										onAir: false
									}
								}
							})
						])
					}
				})
			} else {
				adlibItems.push({
					externalId: `dskon${dsk.Number}`,
					name: `DSK ${dsk.Number} ON`,
					_rank: 500 + dsk.Number,
					sourceLayerId: pgmDSKLayers[dsk.Number],
					outputLayerId: SharedOutputLayers.SEC,
					lifespan: PieceLifespan.OutOnRundownEnd,
					tags: [AdlibTags.ADLIB_STATIC_BUTTON],
					content: {
						timelineObjects: _.compact<TSR.TSRTimelineObj>([
							literal<TSR.TimelineObjAtemDSK>({
								id: '',
								enable: { while: '1' },
								priority: 10,
								layer: atemLLayersDSK[dsk.Number],
								content: {
									deviceType: TSR.DeviceType.ATEM,
									type: TSR.TimelineContentTypeAtem.DSK,
									dsk: {
										onAir: true,
										sources: {
											fillSource: dsk.Fill,
											cutSource: dsk.Key
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
							})
						])
					}
				})
			}
		}
	}

	adlibItems.push({
		externalId: 'micUp',
		name: 'Mics Up',
		_rank: 600,
		sourceLayerId: SourceLayer.PgmSisyfosAdlibs,
		outputLayerId: SharedOutputLayers.SEC,
		lifespan: PieceLifespan.WithinPart,
		tags: [AdlibTags.ADLIB_STATIC_BUTTON],
		expectedDuration: 0,
		content: {
			timelineObjects: _.compact<TSR.TSRTimelineObj>([
				...config.studio.StudioMics.map<TSR.TimelineObjSisyfosChannel>(layer => {
					return literal<TSR.TimelineObjSisyfosChannel>({
						id: '',
						enable: { start: 0 },
						priority: 1,
						layer,
						content: {
							deviceType: TSR.DeviceType.SISYFOS,
							type: TSR.TimelineContentTypeSisyfos.CHANNEL,
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
		_rank: 650,
		sourceLayerId: SourceLayer.PgmSisyfosAdlibs,
		outputLayerId: SharedOutputLayers.SEC,
		lifespan: PieceLifespan.WithinPart,
		tags: [AdlibTags.ADLIB_STATIC_BUTTON],
		expectedDuration: 0,
		content: {
			timelineObjects: _.compact<TSR.TSRTimelineObj>([
				...config.studio.StudioMics.map<TSR.TimelineObjSisyfosChannel>(layer => {
					return literal<TSR.TimelineObjSisyfosChannel>({
						id: '',
						enable: { start: 0 },
						priority: 1,
						layer,
						content: {
							deviceType: TSR.DeviceType.SISYFOS,
							type: TSR.TimelineContentTypeSisyfos.CHANNEL,
							isPgm: 0
						}
					})
				})
			])
		}
	})

	adlibItems.push({
		externalId: 'resyncSisyfos',
		name: 'Resync Sisyfos',
		_rank: 700,
		sourceLayerId: SourceLayer.PgmSisyfosAdlibs,
		outputLayerId: SharedOutputLayers.SEC,
		lifespan: PieceLifespan.WithinPart,
		tags: [AdlibTags.ADLIB_STATIC_BUTTON],
		expectedDuration: 1000,
		content: {
			timelineObjects: _.compact<TSR.TSRTimelineObj>([
				literal<TSR.TimelineObjSisyfosChannel>({
					id: '',
					enable: { start: 0 },
					priority: 2,
					layer: SisyfosLLAyer.SisyfosResync,
					content: {
						deviceType: TSR.DeviceType.SISYFOS,
						type: TSR.TimelineContentTypeSisyfos.CHANNEL,
						resync: true
					}
				})
			])
		}
	})

	// viz styles and dve backgrounds
	adlibItems.push(
		literal<IBlueprintAdLibPiece>({
			_rank: 301,
			externalId: 'dve-design-sc',
			name: 'DVE Design SC',
			outputLayerId: SharedOutputLayers.SEC,
			sourceLayerId: SourceLayer.PgmDesign,
			lifespan: PieceLifespan.OutOnRundownEnd,
			content: literal<GraphicsContent>({
				fileName: 'BG_LOADER_SC',
				path: 'BG_LOADER_SC',
				ignoreMediaObjectStatus: true,
				timelineObjects: _.compact<TSR.TSRTimelineObj>([
					literal<TSR.TimelineObjVIZMSEElementInternal>({
						id: '',
						enable: { start: 0 },
						priority: 110,
						layer: GraphicLLayer.GraphicLLayerDesign,
						content: {
							deviceType: TSR.DeviceType.VIZMSE,
							type: TSR.TimelineContentTypeVizMSE.ELEMENT_INTERNAL,
							templateName: 'BG_LOADER_SC',
							templateData: []
						}
					}),
					literal<TSR.TimelineObjCCGMedia>({
						id: '',
						enable: { start: 0 },
						priority: 110,
						layer: CasparLLayer.CasparCGDVELoop,
						content: {
							deviceType: TSR.DeviceType.CASPARCG,
							type: TSR.TimelineContentTypeCasparCg.MEDIA,
							file: 'dve/BG_LOADER_SC',
							loop: true
						}
					})
				])
			})
		})
	)

	adlibItems.push({
		externalId: 'stopAudioBed',
		name: 'Stop Soundplayer',
		_rank: 700,
		sourceLayerId: SourceLayer.PgmAudioBed,
		outputLayerId: 'musik',
		expectedDuration: 1000,
		lifespan: PieceLifespan.WithinPart,
		content: {
			timelineObjects: [
				literal<TSR.TimelineObjEmpty>({
					id: '',
					enable: {
						start: 0,
						duration: 1000
					},
					priority: 50,
					layer: SisyfosLLAyer.SisyfosSourceAudiobed,
					content: {
						deviceType: TSR.DeviceType.ABSTRACT,
						type: 'empty'
					},
					classes: []
				})
			]
		}
	})

	adlibItems.forEach(p => postProcessPieceTimelineObjects(context, config, p, true))
	return adlibItems
}

function getGlobalAdlibActionsAFVD(_context: ShowStyleContext, config: BlueprintConfig): IBlueprintActionManifest[] {
	const res: IBlueprintActionManifest[] = []

	let globalRank = 1000

	function makeAdlibBoxesActions(info: SourceInfo, type: 'Kamera' | 'Live', rank: number) {
		Object.values(boxLayers).forEach((layer, box) => {
			res.push(
				literal<IBlueprintActionManifest>({
					actionId: AdlibActionType.CUT_SOURCE_TO_BOX,
					userData: literal<ActionCutSourceToBox>({
						type: AdlibActionType.CUT_SOURCE_TO_BOX,
						name: `${type} ${info.id}`,
						port: info.port,
						sourceType: info.type,
						box
					}),
					userDataManifest: {},
					display: {
						_rank: rank + 0.1 * box,
						label: `${type} ${info.id} to box ${box + 1}`,
						sourceLayerId: layer,
						outputLayerId: SharedOutputLayers.SEC,
						content: {},
						tags: []
					}
				})
			)
		})
	}

	function makeAdlibBoxesActionsDirectPlayback(info: SourceInfo, vo: boolean, rank: number) {
		Object.values(boxLayers).forEach((layer, box) => {
			res.push(
				literal<IBlueprintActionManifest>({
					actionId: AdlibActionType.CUT_SOURCE_TO_BOX,
					userData: literal<ActionCutSourceToBox>({
						type: AdlibActionType.CUT_SOURCE_TO_BOX,
						name: `EVS ${info.id.replace(/dp/i, '')}${vo ? ' VO' : ''}`,
						port: info.port,
						sourceType: info.type,
						box,
						vo
					}),
					userDataManifest: {},
					display: {
						_rank: rank + 0.1 * box,
						label: `EVS ${info.id.replace(/dp/i, '')}${vo ? ' VO' : ''} to box ${box + 1}`,
						sourceLayerId: layer,
						outputLayerId: SharedOutputLayers.SEC,
						content: {},
						tags: []
					}
				})
			)
		})
	}

	function makeServerAdlibBoxesActions(rank: number) {
		Object.values(boxLayers).forEach((layer, box) => {
			res.push(
				literal<IBlueprintActionManifest>({
					actionId: AdlibActionType.CUT_SOURCE_TO_BOX,
					userData: literal<ActionCutSourceToBox>({
						type: AdlibActionType.CUT_SOURCE_TO_BOX,
						name: `SERVER`,
						port: -1,
						sourceType: SourceLayerType.VT,
						box,
						server: true
					}),
					userDataManifest: {},
					display: {
						_rank: rank + 0.1 * box,
						label: `Server to box ${box + 1}`,
						sourceLayerId: layer,
						outputLayerId: SharedOutputLayers.SEC,
						content: {},
						tags: []
					}
				})
			)
		})
	}

	function makeCutCameraActions(info: SourceInfo, queue: boolean, rank: number) {
		res.push(
			literal<IBlueprintActionManifest>({
				actionId: AdlibActionType.CUT_TO_CAMERA,
				userData: literal<ActionCutToCamera>({
					type: AdlibActionType.CUT_TO_CAMERA,
					queue,
					name: info.id
				}),
				userDataManifest: {},
				display: {
					_rank: rank,
					label: `KAM ${info.id}`,
					sourceLayerId: SourceLayer.PgmCam,
					outputLayerId: SharedOutputLayers.PGM,
					content: {}
				}
			})
		)
	}

	config.sources
		.filter(u => u.type === SourceLayerType.CAMERA)
		.slice(0, 5) // the first x cameras to create INP1/2/3 cam-adlibs from
		.forEach(o => {
			makeCutCameraActions(o, false, globalRank++)
		})

	config.sources
		.filter(u => u.type === SourceLayerType.CAMERA)
		.slice(0, 5) // the first x cameras to create preview cam-adlibs from
		.forEach(o => {
			makeCutCameraActions(o, true, globalRank++)
		})

	config.sources
		.filter(u => u.type === SourceLayerType.CAMERA)
		.slice(0, 5) // the first x cameras to dve actions from
		.forEach(o => {
			makeAdlibBoxesActions(o, 'Kamera', globalRank++)
		})

	res.push(
		literal<IBlueprintActionManifest>({
			actionId: AdlibActionType.RECALL_LAST_LIVE,
			userData: literal<ActionRecallLastLive>({
				type: AdlibActionType.RECALL_LAST_LIVE
			}),
			userDataManifest: {},
			display: {
				_rank: 1,
				label: 'Last Live',
				sourceLayerId: SourceLayer.PgmLive,
				outputLayerId: SharedOutputLayers.PGM
			}
		})
	)

	config.sources
		.filter(u => u.type === SourceLayerType.REMOTE)
		.slice(0, 10) // the first x remote to create INP1/2/3 live-adlibs from
		.forEach(o => {
			makeAdlibBoxesActions(o, 'Live', globalRank++)
		})

	config.sources
		.filter(u => u.type === SourceLayerType.LOCAL)
		.slice(0, 10) // the first x remote to create INP1/2/3 live-adlibs from
		.forEach(o => {
			makeAdlibBoxesActionsDirectPlayback(o, false, globalRank++)
			makeAdlibBoxesActionsDirectPlayback(o, true, globalRank++)
		})

	makeServerAdlibBoxesActions(globalRank++)

	res.push(
		literal<IBlueprintActionManifest>({
			actionId: AdlibActionType.CLEAR_GRAPHICS,
			userData: literal<ActionClearGraphics>({
				type: AdlibActionType.CLEAR_GRAPHICS,
				sendCommands: true,
				label: 'GFX Clear'
			}),
			userDataManifest: {},
			display: {
				_rank: 300,
				label: `GFX Clear`,
				sourceLayerId: SourceLayer.PgmAdlibGraphicCmd,
				outputLayerId: SharedOutputLayers.SEC,
				content: {},
				tags: [AdlibTags.ADLIB_STATIC_BUTTON],
				currentPieceTags: [TallyTags.GFX_CLEAR],
				nextPieceTags: [TallyTags.GFX_CLEAR]
			}
		}),
		literal<IBlueprintActionManifest>({
			actionId: AdlibActionType.CLEAR_GRAPHICS,
			userData: literal<ActionClearGraphics>({
				type: AdlibActionType.CLEAR_GRAPHICS,
				sendCommands: false,
				label: 'GFX Altud'
			}),
			userDataManifest: {},
			display: {
				_rank: 400,
				label: `GFX Altud`,
				sourceLayerId: SourceLayer.PgmAdlibGraphicCmd,
				outputLayerId: SharedOutputLayers.SEC,
				content: {},
				tags: [AdlibTags.ADLIB_STATIC_BUTTON],
				currentPieceTags: [TallyTags.GFX_ALTUD],
				nextPieceTags: [TallyTags.GFX_ALTUD]
			}
		})
	)

	res.push(...GetTransitionAdLibActions(config, 800))

	res.push(
		literal<IBlueprintActionManifest>({
			actionId: AdlibActionType.RECALL_LAST_DVE,
			userData: literal<ActionRecallLastDVE>({
				type: AdlibActionType.RECALL_LAST_DVE
			}),
			userDataManifest: {},
			display: {
				_rank: 1,
				label: 'Last DVE',
				sourceLayerId: SourceLayer.PgmDVE,
				outputLayerId: 'pgm'
			}
		})
	)

	_.each(config.showStyle.DVEStyles, (dveConfig, i) => {
		// const boxSources = ['', '', '', '']
		res.push(
			literal<IBlueprintActionManifest>({
				actionId: AdlibActionType.SELECT_DVE_LAYOUT,
				userData: literal<ActionSelectDVELayout>({
					type: AdlibActionType.SELECT_DVE_LAYOUT,
					config: dveConfig
				}),
				userDataManifest: {},
				display: {
					_rank: 200 + i,
					label: dveConfig.DVEName,
					sourceLayerId: SourceLayer.PgmDVEAdLib,
					outputLayerId: SharedOutputLayers.PGM
				}
			})
		)
	})

	return res
}

function getBaseline(config: BlueprintConfig): TSR.TSRTimelineObjBase[] {
	return [
		// Default timeline
		literal<TSR.TimelineObjAtemME>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemMEProgram,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.ME,
				me: {
					input: config.studio.AtemSource.Default,
					transition: TSR.AtemTransitionStyle.CUT
				}
			}
		}),
		literal<TSR.TimelineObjAtemME>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemMEClean,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.ME,
				me: {
					input: config.studio.AtemSource.Default,
					transition: TSR.AtemTransitionStyle.CUT
				}
			}
		}),

		// route default outputs
		literal<TSR.TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxPGM,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.AUX,
				aux: {
					input: AtemSourceIndex.Prg1
				}
			}
		}),
		literal<TSR.TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxClean,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.AUX,
				aux: {
					input: AtemSourceIndex.Prg4
				}
			}
		}),
		literal<TSR.TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxLookahead,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.AUX,
				aux: {
					input: config.studio.AtemSource.Default
				}
			}
		}),
		literal<TSR.TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxSSrc,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.AUX,
				aux: {
					input: AtemSourceIndex.SSrc
				}
			}
		}),
		literal<TSR.TimelineObjAtemAUX>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemAuxVideoMixMinus,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.AUX,
				aux: {
					input: config.studio.AtemSource.MixMinusDefault
				}
			}
		}),

		// render presenter screen
		literal<TSR.TimelineObjCCGHTMLPage>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCountdown,
			content: {
				deviceType: TSR.DeviceType.CASPARCG,
				type: TSR.TimelineContentTypeCasparCg.HTMLPAGE,
				url: config.studio.SofieHostURL + '/countdowns/studio0/presenter'
			}
		}),

		// keyers
		literal<TSR.TimelineObjAtemDSK>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemDSKGraphics,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.DSK,
				dsk: {
					onAir: true,
					sources: {
						fillSource: config.dsk[1].Fill,
						cutSource: config.dsk[1].Key
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
		literal<TSR.TimelineObjAtemDSK>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemDSKEffect,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.DSK,
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
		...Object.values(config.dsk)
			.filter(dsk => [3, 4].includes(dsk.Number) && dsk.DefaultOn)
			.map(dsk => {
				return literal<TSR.TimelineObjAtemDSK>({
					id: '',
					enable: { while: '1' },
					priority: 0,
					layer: atemLLayersDSK[dsk.Number],
					content: {
						deviceType: TSR.DeviceType.ATEM,
						type: TSR.TimelineContentTypeAtem.DSK,
						dsk: {
							onAir: true,
							sources: {
								fillSource: config.dsk[dsk.Number].Fill,
								cutSource: config.dsk[dsk.Number].Key
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
				})
			}),
		// slaves the DSK2 for jingles to ME4 USK1 to have effects on CLEAN (ME4)
		literal<TSR.TimelineObjAtemME>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemCleanUSKEffect,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.ME,
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
		literal<TSR.TimelineObjAtemSsrcProps>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemSSrcArt,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.SSRCPROPS,
				ssrcProps: {
					artFillSource: config.studio.AtemSource.SplitArtF,
					artCutSource: config.studio.AtemSource.SplitArtK,
					artOption: 1,
					artPreMultiplied: true
				}
			}
		}),
		literal<TSR.TimelineObjAtemSsrc>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: AtemLLayer.AtemSSrcDefault,
			content: {
				deviceType: TSR.DeviceType.ATEM,
				type: TSR.TimelineContentTypeAtem.SSRC,
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
		literal<TSR.TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGDVEFrame,
			content: {
				deviceType: TSR.DeviceType.CASPARCG,
				type: TSR.TimelineContentTypeCasparCg.MEDIA,
				file: 'empty',
				mixer: {
					opacity: 0
				},
				transitions: {
					inTransition: {
						type: TSR.Transition.CUT,
						duration: CONSTANTS.DefaultClipFadeOut
					}
				}
			}
		}),
		literal<TSR.TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGDVEKey,
			content: {
				deviceType: TSR.DeviceType.CASPARCG,
				type: TSR.TimelineContentTypeCasparCg.MEDIA,
				file: 'empty',
				mixer: {
					opacity: 0
				},
				transitions: {
					inTransition: {
						type: TSR.Transition.CUT,
						duration: CONSTANTS.DefaultClipFadeOut
					}
				}
			}
		}),
		literal<TSR.TimelineObjCCGMedia>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: CasparLLayer.CasparCGDVELoop,
			content: {
				deviceType: TSR.DeviceType.CASPARCG,
				type: TSR.TimelineContentTypeCasparCg.MEDIA,
				file: 'empty',
				transitions: {
					inTransition: {
						type: TSR.Transition.CUT,
						duration: CONSTANTS.DefaultClipFadeOut
					}
				}
			}
		}),
		literal<TSR.TimelineObjCCGRoute>({
			id: '',
			enable: { while: 1 },
			priority: 0,
			layer: CasparLLayer.CasparCGFullBg,
			content: {
				deviceType: TSR.DeviceType.CASPARCG,
				type: TSR.TimelineContentTypeCasparCg.ROUTE,
				mappedLayer: CasparLLayer.CasparCGDVELoop
			}
		}),

		literal<TSR.TimelineObjSisyfosChannels>({
			id: '',
			enable: { while: '1' },
			priority: 0,
			layer: SisyfosLLAyer.SisyfosConfig,
			content: {
				deviceType: TSR.DeviceType.SISYFOS,
				type: TSR.TimelineContentTypeSisyfos.CHANNELS,
				channels: Object.keys(sisyfosChannels).map(key => {
					const llayer = key as SisyfosLLAyer
					const channel = sisyfosChannels[llayer] as SisyfosChannel
					return literal<TSR.TimelineObjSisyfosChannels['content']['channels'][0]>({
						mappedLayer: llayer,
						isPgm: channel.isPgm,
						visible: !channel.hideInStudioA,
						label: channel.label
					})
				}),
				overridePriority: 0
			}
		}),

		...CreateLYDBaseline('afvd'),

		...(config.showStyle.CasparCGLoadingClip && config.showStyle.CasparCGLoadingClip.length
			? [...config.mediaPlayers.map(mp => CasparPlayerClipLoadingLoop(mp.id))].map(layer => {
					return literal<TSR.TimelineObjCCGMedia>({
						id: '',
						enable: { while: '1' },
						priority: 0,
						layer,
						content: {
							deviceType: TSR.DeviceType.CASPARCG,
							type: TSR.TimelineContentTypeCasparCg.MEDIA,
							file: config.showStyle.CasparCGLoadingClip,
							loop: true
						}
					})
			  })
			: [])
	]
}
