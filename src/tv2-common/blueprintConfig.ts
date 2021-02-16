import {
	TableConfigItemSourceMappingWithSisyfos,
	TableConfigItemSourceMappingWithSisyfosAndKeepAudio
} from 'tv2-common'
import { DVEConfigInput } from './helpers'
import { SourceInfo } from './sources'

export type MediaPlayerConfig = Array<{ id: string; val: string }>

export interface TableConfigItemBreakers {
	BreakerName: string
	ClipName: string
	Duration: number
	StartAlpha: number
	EndAlpha: number
	Autonext: boolean
	LoadFirstFrame: boolean
}

export interface TableConfigItemGFXTemplates {
	VizTemplate: string
	SourceLayer: string
	LayerMapping: string
	INewsCode: string
	INewsName: string
	VizDestination: string
	OutType: string
	Argument1: string
	Argument2: string
	IsDesign: boolean
}

export interface TableConfigItemAdLibTransitions {
	Transition: string
}

export interface TV2StudioConfigBase {
	MaximumPartDuration: number
	DefaultPartDuration: number
	CasparPrerollDuration: number
	NetworkBasePath: string
	ClipMediaFlowId: string
	ClipBasePath: string
	ClipFileExtension: string
	JingleMediaFlowId: string
	JingleBasePath: string
	JingleFileExtension: string
	ABPlaybackDebugLogging: boolean
	AtemSource: {
		Default: number
		SplitArtF: number
		SplitArtK: number
		DSK1F: number
		DSK1K: number
		JingleFill: number
		JingleKey: number
	}
	AtemSettings: {
		CCGClip: number
		CCGGain: number
	}
	StudioMics: string[]
	SourcesRM: TableConfigItemSourceMappingWithSisyfosAndKeepAudio[]
	SourcesSkype: TableConfigItemSourceMappingWithSisyfos[]
	SourcesCam: TableConfigItemSourceMappingWithSisyfos[]
	PreventOverlayWithFull?: boolean
	ServerPostrollDuration: number
}

export interface TV2StudioBlueprintConfigBase<StudioConfig extends TV2StudioConfigBase> {
	studio: StudioConfig
	sources: SourceInfo[]
	mediaPlayers: MediaPlayerConfig // Atem Input Ids
	liveAudio: string[]
	stickyLayers: string[]
}

export interface TV2ShowstyleBlueprintConfigBase {
	DefaultTemplateDuration: number
	CasparCGLoadingClip: string
	BreakerConfig: TableConfigItemBreakers[]
	DVEStyles: DVEConfigInput[]
	GFXTemplates: TableConfigItemGFXTemplates[]
	Transitions: TableConfigItemAdLibTransitions[]
	ShowstyleTransition: string
}

export interface TV2BlueprintConfigBase<StudioConfig extends TV2StudioConfigBase>
	extends TV2StudioBlueprintConfigBase<StudioConfig> {
	showStyle: TV2ShowstyleBlueprintConfigBase
}

export type TV2BlueprintConfig = TV2BlueprintConfigBase<TV2StudioConfigBase>
