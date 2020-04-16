import * as _ from 'underscore'

import { RealLLayers } from '../layers'
import MappingsDefaults from '../migrations/mappings-defaults'

describe('Migration Defaults', () => {
	test('MappingsDefaults', () => {
		const allMappings = {
			...MappingsDefaults
			// Inject MediaPlayer ones, as they are used directly and part of the enum
		}
		const defaultsIds = _.map(allMappings, (v, id) => {
			v = v
			return id
		}).sort()

		// Inject core_abstract as it is required by core and so needs to be defined
		const layerIds = RealLLayers()
			.concat(['core_abstract'])
			.concat([
				'casparcg_player_clip_1',
				'casparcg_player_clip_2',
				'casparcg_player_clip_1_loading_loop',
				'casparcg_player_clip_2_loading_loop'
			])
			.sort()

		expect(defaultsIds).toEqual(layerIds)
	})
})