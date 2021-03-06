import * as crypto from 'crypto'
import * as _ from 'underscore'

import {
	BlueprintMappings,
	ConfigItemValue,
	IBlueprintRundownDB,
	ICommonContext,
	NotesContext as INotesContext,
	SegmentContext as ISegmentContext,
	ShowStyleContext as IShowStyleContext
} from '@sofie-automation/blueprints-integration'
import { NoteType } from 'tv2-constants'
import { parseConfig as parseShowStyleConfig } from '../tv2_afvd_showstyle/helpers/config'
import { parseConfig } from '../tv2_afvd_studio/helpers/config'

export function getHash(str: string): string {
	const hash = crypto.createHash('sha1')
	return hash
		.update(str)
		.digest('base64')
		.replace(/[\+\/\=]/gi, '_') // remove +/= from strings, because they cause troubles
}

export class CommonContext implements ICommonContext {
	private _idPrefix: string = ''
	private hashI = 0
	private hashed: { [hash: string]: string } = {}

	constructor(idPrefix: string) {
		this._idPrefix = idPrefix
	}
	public getHashId(str?: any) {
		if (!str) {
			str = 'hash' + this.hashI++
		}

		let id
		id = getHash(this._idPrefix + '_' + str.toString())
		this.hashed[id] = str
		return id
		// return Random.id()
	}
	public unhashId(hash: string): string {
		return this.hashed[hash] || hash
	}
}

export interface PartNote {
	type: NoteType
	origin: {
		name: string
		roId?: string
		segmentId?: string
		partId?: string
		pieceId?: string
	}
	message: string
}

// tslint:disable-next-line: max-classes-per-file
export class NotesContext extends CommonContext implements INotesContext {
	private _contextName: string
	private _rundownId?: string
	private _segmentId?: string
	private _partId?: string

	private savedNotes: PartNote[] = []

	constructor(contextName: string, rundownId?: string, segmentId?: string, partId?: string) {
		super(rundownId + (partId ? '_' + partId : segmentId ? '_' + segmentId : ''))
		this._contextName = contextName
		this._rundownId = rundownId
		this._segmentId = segmentId
		this._partId = partId
	}
	/** Throw Error and display message to the user in the GUI */
	public error(message: string) {
		// logger.error('Error from blueprint: ' + message)
		this._pushNote(NoteType.ERROR, message)
		throw new Error(message)
	}
	/** Save note, which will be displayed to the user in the GUI */
	public warning(message: string) {
		this._pushNote(NoteType.WARNING, message)
	}
	public getNotes() {
		return this.savedNotes
	}
	private _pushNote(type: NoteType, message: string) {
		// console.log(message)
		this.savedNotes.push({
			type,
			origin: {
				name: this._getLoggerName(),
				roId: this._rundownId,
				segmentId: this._segmentId,
				partId: this._partId
			},
			message
		})
	}
	private _getLoggerName() {
		return this._contextName
	}
}

// tslint:disable-next-line: max-classes-per-file
export class LoggingNotesContext extends CommonContext implements INotesContext {
	constructor(id?: string) {
		super(id || 'LoggingNotesContext')
	}

	public getNotes() {
		// We log it instead of returning notes
		return []
	}

	/** Throw Error and display message to the user in the GUI */
	public error(message: string) {
		// logger.error('Error from blueprint: ' + message)
		// tslint:disable-next-line: no-console
		console.error(message)
		throw new Error(message)
	}
	/** Save note, which will be displayed to the user in the GUI */
	public warning(message: string) {
		// tslint:disable-next-line: no-console
		console.log(message)
	}
}

// tslint:disable-next-line: max-classes-per-file
export class ShowStyleContext extends NotesContext implements IShowStyleContext {
	public studioConfig: { [key: string]: ConfigItemValue } = {}
	public showStyleConfig: { [key: string]: ConfigItemValue } = {}

	private mappingsDefaults: BlueprintMappings

	constructor(contextName: string, mappingsDefaults: BlueprintMappings, rundownId?: string) {
		super(contextName, rundownId)
		this.mappingsDefaults = mappingsDefaults
	}
	public getStudioConfig(): { [key: string]: ConfigItemValue } {
		return parseConfig(this.studioConfig)
	}
	public getStudioConfigRef(configKey: string): string {
		return 'studio.mock.' + configKey // just a placeholder
	}
	public getShowStyleConfig(): { [key: string]: ConfigItemValue } {
		return parseShowStyleConfig(this.showStyleConfig)
	}
	public getShowStyleConfigRef(configKey: string): string {
		return 'showStyle.mock.' + configKey // just a placeholder
	}
	public getStudioMappings(): BlueprintMappings {
		return _.clone(this.mappingsDefaults)
	}
}

// tslint:disable-next-line: max-classes-per-file
export class SegmentContext extends ShowStyleContext implements ISegmentContext {
	public rundownId: string
	public rundown: IBlueprintRundownDB

	constructor(rundown: IBlueprintRundownDB, mappings: BlueprintMappings, contextName?: string) {
		super(contextName || rundown.name, mappings, rundown._id)

		this.rundownId = rundown._id
		this.rundown = rundown
	}

	public hackGetMediaObjectDuration(_mediaId: string): number | undefined {
		return undefined
	}
}
