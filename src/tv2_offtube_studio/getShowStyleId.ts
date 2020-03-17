import {
	IBlueprintShowStyleBase,
	IngestRundown,
	IStudioConfigContext
} from 'tv-automation-sofie-blueprints-integration'
import * as _ from 'underscore'

export function getShowStyleId(
	_context: IStudioConfigContext,
	showStyles: IBlueprintShowStyleBase[],
	_ingestRundown: IngestRundown
): string | null {
	const showStyle = showStyles.find(s => s.config.includes({ _id: 'IsOfftube', value: true })) || _.first(showStyles)
	if (showStyle) {
		return showStyle._id
	}

	return null
}