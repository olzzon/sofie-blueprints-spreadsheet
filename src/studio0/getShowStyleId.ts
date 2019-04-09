import { IngestRunningOrder, IStudioConfigContext, IBlueprintShowStyleBase } from 'tv-automation-sofie-blueprints-integration'
import * as _ from 'underscore'

export function getShowStyleId (_context: IStudioConfigContext, showStyles: Array<IBlueprintShowStyleBase>, _ingestRunningOrder: IngestRunningOrder): string | null {
	const showStyle = _.first(showStyles)
	if (showStyle) {
		return showStyle._id
	}

	return null
}
