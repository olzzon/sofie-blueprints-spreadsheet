import * as _ from 'underscore'

import { SourceLayerType } from 'tv-automation-sofie-blueprints-integration'
import { SourceInfo } from 'tv2-common'
import { StudioConfig } from './config'

export function parseMediaPlayers(studioConfig: StudioConfig): Array<{ id: string; val: string }> {
	return studioConfig.ABMediaPlayers.map(player => ({ id: player.SourceName, val: player.AtemSource.toString() }))
}

export function parseSources(studioConfig: StudioConfig): SourceInfo[] {
	const res: SourceInfo[] = []

	_.each(studioConfig.SourcesRM, rm => {
		res.push({
			type: SourceLayerType.REMOTE,
			id: rm.SourceName as string,
			port: rm.AtemSource as number,
			sisyfosLayers: rm.SisyfosLayers as string[]
		})
	})

	_.each(studioConfig.SourcesCam, kam => {
		res.push({
			type: SourceLayerType.CAMERA,
			id: kam.SourceName as string,
			port: kam.AtemSource as number,
			sisyfosLayers: kam.SisyfosLayers as string[]
		})
	})

	_.each(studioConfig.SourcesSkype, sk => {
		res.push({
			type: SourceLayerType.REMOTE,
			id: `S${sk.SourceName}`,
			port: sk.AtemSource as number,
			sisyfosLayers: sk.SisyfosLayers as string[]
		})
	})

	_.each(studioConfig.SourcesDelayedPlayback, dp => {
		res.push({
			type: SourceLayerType.REMOTE,
			id: `DP${dp.SourceName}`,
			port: dp.AtemSource as number,
			sisyfosLayers: dp.SisyfosLayers as string[]
		})
	})

	return res
}
