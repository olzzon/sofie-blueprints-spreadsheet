import {
	DeviceType,
	TimelineContentTypeAtem,
	TimelineObjAtemAUX,
	TimelineObjAtemDSK,
	TimelineObjAtemME
} from 'timeline-state-resolver-types'
import {
	BlueprintResultPart,
	IBlueprintPieceGeneric,
	NotesContext,
	OnGenerateTimelineObj,
	SegmentContext,
	TimelineObjectCoreExt,
	TimelineObjHoldMode
} from 'tv-automation-sofie-blueprints-integration'
import * as _ from 'underscore'
import { literal } from '../common/util'
import { BlueprintConfig } from '../tv2_afvd_studio/helpers/config'
import { AtemLLayer } from '../tv2_afvd_studio/layers'
import { TimelineBlueprintExt } from '../tv2_afvd_studio/onTimelineGenerate'
import { PartContext2 } from './getSegment'
import { SourceLayer } from './layers'

export function postProcessPartTimelineObjects(
	context: SegmentContext,
	config: BlueprintConfig,
	parts: BlueprintResultPart[]
) {
	_.each(parts, part => {
		const ctx = new PartContext2(context, part.part.externalId)
		_.each(part.pieces, p => postProcessPieceTimelineObjects(ctx, config, p))
		_.each(part.adLibPieces, p => postProcessPieceTimelineObjects(ctx, config, p))
	})
}

// Do any post-process of timeline objects
export function postProcessPieceTimelineObjects(
	context: NotesContext,
	config: BlueprintConfig,
	piece: IBlueprintPieceGeneric
) {
	if (piece.content?.timelineObjects) {
		const extraObjs: TimelineObjectCoreExt[] = []

		const atemMeObjs = (piece.content.timelineObjects as Array<
			TimelineObjAtemME & TimelineBlueprintExt & OnGenerateTimelineObj
		>).filter(
			obj =>
				obj.content && obj.content.deviceType === DeviceType.ATEM && obj.content.type === TimelineContentTypeAtem.ME
		)
		_.each(atemMeObjs, tlObj => {
			if (tlObj.layer === AtemLLayer.AtemMEProgram) {
				if (!tlObj.id) {
					tlObj.id = context.getHashId(AtemLLayer.AtemMEProgram, true)
				}
				if (!tlObj.metaData) {
					tlObj.metaData = {}
				}

				// Basic clone of every object to AtemMEClean
				const cleanObj = _.clone(tlObj) // Note: shallow clone
				cleanObj.layer = AtemLLayer.AtemMEClean
				cleanObj.id = '' // Force new id
				cleanObj.metaData = _.clone(tlObj.metaData)
				cleanObj.metaData.context = `Clean for ${tlObj.id}`
				extraObjs.push(cleanObj)

				if (tlObj.content.me.input !== undefined || tlObj.metaData?.mediaPlayerSession !== undefined) {
					// Create a lookahead-lookahead object for this me-program
					const lookaheadObj = literal<TimelineObjAtemAUX & TimelineBlueprintExt>({
						id: '',
						enable: { start: 0 },
						priority: tlObj.holdMode === TimelineObjHoldMode.ONLY ? 5 : 0, // Must be below lookahead, except when forced by hold
						layer: AtemLLayer.AtemAuxLookahead,
						holdMode: tlObj.holdMode,
						content: {
							deviceType: DeviceType.ATEM,
							type: TimelineContentTypeAtem.AUX,
							aux: {
								input: tlObj.content.me.input || config.studio.AtemSource.Default
							}
						},
						metaData: {
							context: `Lookahead-lookahead for ${tlObj.id}`,
							mediaPlayerSession: tlObj.metaData?.mediaPlayerSession // TODO - does this work the same?
						}
					})
					extraObjs.push(lookaheadObj)
				}

				// mix minus
				if (piece.sourceLayerId !== SourceLayer.PgmLive && piece.sourceLayerId !== SourceLayer.PgmDVE) {
					const mixMinusObj = literal<TimelineObjAtemAUX & TimelineBlueprintExt>({
						..._.omit(tlObj, 'content'),
						...literal<Partial<TimelineObjAtemAUX & TimelineBlueprintExt>>({
							id: '',
							layer: AtemLLayer.AtemAuxVideoMixMinus,
							content: {
								deviceType: DeviceType.ATEM,
								type: TimelineContentTypeAtem.AUX,
								aux: {
									input: tlObj.content.me.input || config.studio.AtemSource.MixMinusDefault
								}
							},
							metaData: {
								...tlObj.metaData,
								context: `Mix-minus for ${tlObj.id}`
							}
						})
					})
					extraObjs.push(mixMinusObj)
				}
			}
		})

		const atemDskObjs = (piece.content.timelineObjects as TimelineObjAtemDSK[]).filter(
			obj =>
				obj.content && obj.content.deviceType === DeviceType.ATEM && obj.content.type === TimelineContentTypeAtem.DSK
		)
		_.each(atemDskObjs, tlObj => {
			if (tlObj.layer === AtemLLayer.AtemDSKEffect) {
				const newProps = _.pick(tlObj.content.dsk, 'onAir')
				if (_.isEqual(newProps, tlObj.content.dsk)) {
					context.warning(`Unhandled Keyer properties for Clean keyer, it may look wrong`)
				}

				const cleanObj = literal<TimelineObjAtemME & TimelineBlueprintExt>({
					..._.omit(tlObj, 'content'),
					...literal<Partial<TimelineObjAtemME & TimelineBlueprintExt>>({
						id: '',
						layer: AtemLLayer.AtemCleanUSKEffect,
						content: {
							deviceType: DeviceType.ATEM,
							type: TimelineContentTypeAtem.ME,
							me: {
								upstreamKeyers: [
									{
										upstreamKeyerId: 0
									},
									{
										upstreamKeyerId: 1,
										...newProps
									}
								]
							}
						}
					})
				})
				extraObjs.push(cleanObj)
			}
		})

		piece.content.timelineObjects = piece.content.timelineObjects.concat(extraObjs)
	}
}