import {
	ConfigItemValue,
	MigrationContextShowStyle,
	MigrationContextStudio,
	MigrationStepShowStyle,
	MigrationStepStudio
} from '@sofie-automation/blueprints-integration'
import { TableConfigItemGFXTemplates } from 'tv2-common'
import { literal } from '../util'

export * from './moveSourcesToTable'
export * from './addKeepAudio'
export * from './shortcuts'
export * from './transitions'
export * from './graphic-defaults'
export * from './manifestWithMediaFlow'

export function RenameStudioConfig(versionStr: string, studio: string, from: string, to: string): MigrationStepStudio {
	return literal<MigrationStepStudio>({
		id: `studioConfig.rename.${from}.${studio}`,
		version: versionStr,
		canBeRunAutomatically: true,
		validate: (context: MigrationContextStudio) => {
			const configVal = context.getConfig(from)
			if (configVal !== undefined) {
				return `${from} needs updating`
			}
			return false
		},
		migrate: (context: MigrationContextStudio) => {
			const configVal = context.getConfig(from)
			if (configVal !== undefined) {
				context.setConfig(to, configVal)
			}

			context.removeConfig(from)
		}
	})
}

export function renameSourceLayer(
	versionStr: string,
	studioId: string,
	from: string,
	to: string
): MigrationStepShowStyle {
	return literal<MigrationStepShowStyle>({
		id: `renameSourceLayer.${studioId}.${from}.${to}`,
		version: versionStr,
		canBeRunAutomatically: true,
		validate: (context: MigrationContextShowStyle) => {
			const existing = context.getSourceLayer(from)

			return !!existing
		},
		migrate: (context: MigrationContextShowStyle) => {
			const existing = context.getSourceLayer(from)

			if (!existing) {
				return
			}

			context.insertSourceLayer(to, existing)
			context.removeSourceLayer(from)
		}
	})
}

export function removeSourceLayer(versionStr: string, studioId: string, layer: string) {
	return literal<MigrationStepShowStyle>({
		id: `renameSourceLayer.${studioId}.${layer}`,
		version: versionStr,
		canBeRunAutomatically: true,
		validate: (context: MigrationContextShowStyle) => {
			const existing = context.getSourceLayer(layer)

			return !!existing
		},
		migrate: (context: MigrationContextShowStyle) => {
			const existing = context.getSourceLayer(layer)

			if (!existing) {
				return
			}

			context.removeSourceLayer(layer)
		}
	})
}

export function AddGraphicToGFXTable(versionStr: string, studio: string, config: TableConfigItemGFXTemplates) {
	return literal<MigrationStepShowStyle>({
		id: `gfxConfig.add${config.INewsName}.${studio}`,
		version: versionStr,
		canBeRunAutomatically: true,
		validate: (context: MigrationContextShowStyle) => {
			const existing = (context.getBaseConfig('GFXTemplates') as unknown) as TableConfigItemGFXTemplates[] | undefined

			if (!existing || !existing.length) {
				return false
			}

			return !existing.some(
				g =>
					g.INewsName === config.INewsName && g.INewsCode === config.INewsCode && g.VizTemplate === config.VizTemplate
			)
		},
		migrate: (context: MigrationContextShowStyle) => {
			const existing = (context.getBaseConfig('GFXTemplates') as unknown) as TableConfigItemGFXTemplates[]

			existing.push(config)

			context.setBaseConfig('GFXTemplates', (existing as unknown) as ConfigItemValue)
		}
	})
}
