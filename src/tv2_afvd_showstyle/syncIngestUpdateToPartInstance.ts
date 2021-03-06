import {
	BlueprintSyncIngestNewData,
	BlueprintSyncIngestPartInstance,
	SyncIngestUpdateToPartInstanceContext
} from '@sofie-automation/blueprints-integration'
import { syncIngestUpdateToPartInstanceBase } from 'tv2-common'
import * as _ from 'underscore'
import { SourceLayer } from './layers'

export function syncIngestUpdateToPartInstance(
	context: SyncIngestUpdateToPartInstanceContext,
	existingPartInstance: BlueprintSyncIngestPartInstance,
	newPart: BlueprintSyncIngestNewData,
	_playoutStatus: 'current' | 'next'
): void {
	syncIngestUpdateToPartInstanceBase(context, existingPartInstance, newPart, _playoutStatus, [
		SourceLayer.PgmAudioBed,
		SourceLayer.WallGraphics,
		SourceLayer.PgmScript,
		SourceLayer.PgmFullBackground,
		SourceLayer.PgmDVEBackground
	])
}
