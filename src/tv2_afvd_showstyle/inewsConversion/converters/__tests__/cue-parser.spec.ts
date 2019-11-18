import { literal } from '../../../../common/util'
import {
	CueDefinition,
	CueDefinitionJingle,
	CueDefinitionLYD,
	CueDefinitionUnknown,
	CueDefinitionVIZ,
	CueType,
	isTime,
	ParseCue,
	parseTime
} from '../ParseCue'

describe('Cue parser', () => {
	test('Null Cue', () => {
		const result = ParseCue(null)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Unknown
			})
		)
	})

	test('Empty Cue', () => {
		const result = ParseCue([])
		expect(result).toEqual({
			type: CueType.Unknown
		})
	})

	test('Time with symbolic out', () => {
		let time = ';0.01-S'
		let result: any = isTime(time)
		expect(result).toBe(true)
		result = parseTime(time)
		expect(result).toEqual({
			start: {
				seconds: 1
			},
			end: {
				infiniteMode: 'S'
			}
		})
		time = ';0.01-B'
		result = isTime(time)
		expect(result).toBe(true)
		result = parseTime(time)
		expect(result).toEqual({
			start: {
				seconds: 1
			},
			end: {
				infiniteMode: 'B'
			}
		})
		time = ';0.01-O'
		result = isTime(time)
		expect(result).toBe(true)
		result = parseTime(time)
		expect(result).toEqual({
			start: {
				seconds: 1
			},
			end: {
				infiniteMode: 'O'
			}
		})
	})

	test('Time with spaces', () => {
		const time = ';0.01 - B'
		let result: any = isTime(time)
		expect(result).toBe(true)
		result = parseTime(time)
		expect(result).toEqual({
			start: {
				seconds: 1
			},
			end: {
				infiniteMode: 'B'
			}
		})
	})

	test('Grafik (kg) - Inline first text field', () => {
		const cueGrafik = ['kg bund HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk', ';0.02']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk'],
				start: {
					seconds: 2
				}
			})
		)
	})

	test('Grafik (kg) - AdLib ;x.xx', () => {
		const cueGrafik = ['kg bund HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk', ';x.xx']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk'],
				adlib: true
			})
		)
	})

	test('Grafik (kg) - Inline first text field, blank time', () => {
		const cueGrafik = ['kg bund HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk', ';x.xx']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk'],
				adlib: true
			})
		)
	})

	test('Grafik (kg) - Multiline text fields', () => {
		const cueGrafik = ['kg bund', 'HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk', ';0.02']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk'],
				start: {
					seconds: 2
				}
			})
		)
	})

	test('Grafik (kg) - No time', () => {
		const cueGrafik = ['kg bund', 'HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk'],
				adlib: true
			})
		)
	})

	test('Grafik (kg) - Blank Lines', () => {
		const cueGrafik = ['', 'kg bund', '', 'HELENE RØNBJERG KRISTENSEN', '', 'herk@tv2.dk', '']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk'],
				adlib: true
			})
		)
	})

	test('Grafik (kg) - Single line', () => {
		const cueGrafik = ['kg bund 2']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['2'],
				adlib: true
			})
		)
	})

	test('Grafik (kg) - star', () => {
		const cueGrafik = ['*kg bund 2']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['2'],
				adlib: true
			})
		)
	})

	test('Grafik (kg) - Hash', () => {
		const cueGrafik = ['#kg bund 2']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				template: 'bund',
				cue: 'kg',
				textFields: ['2'],
				adlib: true
			})
		)
	})

	test('Grafik (kg) - All out', () => {
		const cueGrafik = ['kg ovl-all-out', 'CLEAR OVERLAY', ';0.00']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Ignored_MOS,
				command: ['kg ovl-all-out', 'CLEAR OVERLAY', ';0.00']
			})
		)
	})

	test('Grafik (kg) - Start and end time', () => {
		const cueGrafik = ['kg bund STIG NIKOLAJ BLOMBERG', 'Forsker, Akutberedskabet, Region Hovedstaden', ';0.27-0.31']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				start: {
					seconds: 27
				},
				end: {
					seconds: 31
				},
				template: 'bund',
				cue: 'kg',
				textFields: ['STIG NIKOLAJ BLOMBERG', 'Forsker, Akutberedskabet, Region Hovedstaden']
			})
		)
	})

	test('DIGI', () => {
		const cueDigi = ['DIGI=VO', 'Dette er en VO tekst', 'Dette er linje 2', ';0.00']
		const result = ParseCue(cueDigi)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				start: {
					seconds: 0
				},
				template: 'VO',
				cue: 'DIGI',
				textFields: ['Dette er en VO tekst', 'Dette er linje 2']
			})
		)
	})

	test('KG=DESIGN_FODBOLD', () => {
		const cueGrafik = ['KG=DESIGN_FODBOLD', ';0.00.01']
		const result = ParseCue(cueGrafik)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Grafik,
				start: {
					frames: 1,
					seconds: 0
				},
				template: 'DESIGN_FODBOLD',
				cue: 'KG',
				textFields: []
			})
		)
		expect(result).toBeTruthy()
	})

	test('MOS object', () => {
		const cueMOS = [
			']] S3.0 M 0 [[',
			'cg4 ]] 2 YNYAB 0 [[ pilotdata',
			'TELEFON/KORT//LIVE_KABUL',
			'VCPID=2552305',
			'ContinueCount=3',
			'TELEFON/KORT//LIVE_KABUL'
		]
		const result = ParseCue(cueMOS)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.MOS,
				name: 'TELEFON/KORT//LIVE_KABUL',
				vcpid: 2552305,
				continueCount: 3,
				start: {
					seconds: 0
				}
			})
		)
	})

	test('MOS object with timing - adlib + O', () => {
		const cueMOS = [
			']] S3.0 M 0 [[',
			'cg4 ]] 1 YNYAB 0 [[ pilotdata',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|M|O',
			'VCPID=2520177',
			'ContinueCount=-1',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|M|O'
		]
		const result = ParseCue(cueMOS)
		expect(result).toEqual({
			type: CueType.MOS,
			name: 'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|M|O',
			vcpid: 2520177,
			continueCount: -1,
			adlib: true,
			end: {
				infiniteMode: 'O'
			}
		})
	})

	test('MOS object with timing - time + O', () => {
		const cueMOS = [
			']] S3.0 M 0 [[',
			'cg4 ]] 1 YNYAB 0 [[ pilotdata',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|00:02|O',
			'VCPID=2520177',
			'ContinueCount=-1',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|00:02|O'
		]
		const result = ParseCue(cueMOS)
		expect(result).toEqual({
			type: CueType.MOS,
			name: 'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|00:02|O',
			vcpid: 2520177,
			continueCount: -1,
			start: {
				seconds: 2
			},
			end: {
				infiniteMode: 'O'
			}
		})
	})

	test('#cg4 pilotdata', () => {
		const cueMOS = [
			'#cg4 pilotdata',
			'TELEFON/KORT//LIVE_KABUL',
			'VCPID=2552305',
			'ContinueCount=3',
			'TELEFON/KORT//LIVE_KABUL'
		]
		const result = ParseCue(cueMOS)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.MOS,
				name: 'TELEFON/KORT//LIVE_KABUL',
				vcpid: 2552305,
				continueCount: 3,
				start: {
					seconds: 0
				},
				engine: '4'
			})
		)
	})

	test('cg12 pilotdata', () => {
		const cueMOS = [
			'cg12 pilotdata',
			'TELEFON/KORT//LIVE_KABUL',
			'VCPID=2552305',
			'ContinueCount=3',
			'TELEFON/KORT//LIVE_KABUL'
		]
		const result = ParseCue(cueMOS)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.MOS,
				name: 'TELEFON/KORT//LIVE_KABUL',
				vcpid: 2552305,
				continueCount: 3,
				start: {
					seconds: 0
				},
				engine: '12'
			})
		)
	})

	test('#cg4 pilotdata with timing', () => {
		const cueMOS = [
			'*cg4 pilotdata',
			'TELEFON/KORT//LIVE_KABUL',
			'VCPID=2552305',
			'ContinueCount=3',
			'TELEFON/KORT//LIVE_KABUL'
		]
		const result = ParseCue(cueMOS)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.MOS,
				name: 'TELEFON/KORT//LIVE_KABUL',
				vcpid: 2552305,
				continueCount: 3,
				start: {
					seconds: 0
				},
				engine: '4'
			})
		)
	})

	test('MOS object with timing - start time + end time', () => {
		const cueMOS = [
			']] S3.0 M 0 [[',
			'cg4 ]] 1 YNYAB 0 [[ pilotdata',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|00:00|00:10',
			'VCPID=2520177',
			'ContinueCount=-1',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|00:00|00:1O'
		]
		const result = ParseCue(cueMOS)
		expect(result).toEqual({
			type: CueType.MOS,
			name: 'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|00:00|00:10',
			vcpid: 2520177,
			continueCount: -1,
			start: {
				seconds: 0
			},
			end: {
				seconds: 10
			}
		})
	})

	test('EKSTERN', () => {
		const cueEkstern = ['EKSTERN=LIVE 1']
		const result = ParseCue(cueEkstern)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Ekstern,
				source: 'LIVE 1'
			})
		)
	})

	test('DVE', () => {
		const cueDVE = ['DVE=sommerfugl', 'INP1=KAM 1', 'INP2=LIVE 1', 'BYNAVN=Odense\\København']
		const result = ParseCue(cueDVE)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.DVE,
				template: 'sommerfugl',
				sources: { INP1: 'KAM 1', INP2: 'LIVE 1' },
				labels: ['Odense', 'København']
			})
		)
	})

	test('DVE', () => {
		const cueDVE = ['DVE=sommerfugl', 'INP1=KAM 1', 'INP2=LIVE 1', 'BYNAVN=Odense/København']
		const result = ParseCue(cueDVE)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.DVE,
				template: 'sommerfugl',
				sources: { INP1: 'KAM 1', INP2: 'LIVE 1' },
				labels: ['Odense', 'København']
			})
		)
	})

	test('TELEFON with Grafik', () => {
		const cueTelefon = ['TELEFON=TLF 2', 'kg bund', 'HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk', ';0.02']
		const result = ParseCue(cueTelefon)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Telefon,
				source: 'TLF 2',
				vizObj: {
					type: CueType.Grafik,
					start: {
						seconds: 2
					},
					template: 'bund',
					cue: 'kg',
					textFields: ['HELENE RØNBJERG KRISTENSEN', 'herk@tv2.dk']
				}
			})
		)
	})

	test('TELEFON with pilot', () => {
		const cueTelefon = [
			'TELEFON=TLF 2',
			']] S3.0 M 0 [[',
			'cg4 ]] 1 YNYAB 0 [[ pilotdata',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|M|O',
			'VCPID=2520177',
			'ContinueCount=-1',
			'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|M|O'
		]
		const result = ParseCue(cueTelefon)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Telefon,
				source: 'TLF 2',
				vizObj: {
					type: CueType.MOS,
					name: 'LgfxWeb/-ETKAEM_07-05-2019_17:55:42/Mosart=L|M|O',
					vcpid: 2520177,
					continueCount: -1,
					adlib: true,
					end: {
						infiniteMode: 'O'
					}
				}
			})
		)
	})

	test('TELEFON without Grafik', () => {
		const cueTelefon = ['TELEFON=TLF 2']
		const result = ParseCue(cueTelefon)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Telefon,
				source: 'TLF 2'
			})
		)
	})

	test('VIZ Cue', () => {
		const cueViz = ['VIZ=grafik-design', 'triopage=DESIGN_SC', ';0.00.04']
		const result = ParseCue(cueViz)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.VIZ,
				rawType: 'VIZ=grafik-design',
				design: 'grafik-design',
				content: {
					triopage: 'DESIGN_SC'
				},
				start: {
					frames: 4,
					seconds: 0
				}
			})
		)
	})

	test('VIZ Cue', () => {
		const cueViz = ['VIZ=full-triopage', 'triopage=DESIGN_SC', ';0.00.04']
		const result = ParseCue(cueViz)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.VIZ,
				rawType: 'VIZ=full-triopage',
				design: 'full-triopage',
				content: {
					triopage: 'DESIGN_SC'
				},
				start: {
					frames: 4,
					seconds: 0
				}
			})
		)
	})

	test('VIZ Cue', () => {
		const cueViz = ['VIZ=dve-triopage', 'triopage=DESIGN_SC', ';0.00.04']
		const result = ParseCue(cueViz)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.VIZ,
				rawType: 'VIZ=dve-triopage',
				design: 'dve-triopage',
				content: {
					triopage: 'DESIGN_SC'
				},
				start: {
					frames: 4,
					seconds: 0
				}
			})
		)
	})

	test('VIZ Cue', () => {
		const cueViz = ['VIZ=dve-triopage', 'GRAFIK=DESIGN_SC', ';0.00.04']
		const result = ParseCue(cueViz)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.VIZ,
				rawType: 'VIZ=dve-triopage',
				design: 'dve-triopage',
				content: {
					GRAFIK: 'DESIGN_SC'
				},
				start: {
					frames: 4,
					seconds: 0
				}
			})
		)
	})

	test('VIZ Cue', () => {
		const cueViz = ['VIZ=full', 'INP1=EVS 1', ';0.00']
		const result = ParseCue(cueViz)
		expect(result).toEqual(
			literal<CueDefinitionVIZ>({
				type: CueType.VIZ,
				rawType: 'VIZ=full',
				design: 'full',
				content: {
					INP1: 'EVS 1'
				},
				start: {
					seconds: 0
				}
			})
		)
	})

	test('Mics', () => {
		const cueMic = [
			'STUDIE=MIC ON OFF',
			'ST2vrt1=OFF',
			'ST2vrt2=OFF',
			'ST2gst1=OFF',
			'ST2gst2=OFF',
			'kom1=OFF',
			'kom2=OFF',
			'ST4vrt=ON',
			'ST4gst=',
			';0.00'
		]
		const result = ParseCue(cueMic)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Mic,
				start: {
					seconds: 0
				},
				mics: {
					ST2vrt1: false,
					ST2vrt2: false,
					ST2gst1: false,
					ST2gst2: false,
					kom1: false,
					kom2: false,
					ST4vrt: true,
					ST4gst: false
				}
			})
		)
	})

	test('AdLib', () => {
		const cueAdLib = ['ADLIBPIX=MORBARN', 'INP1=LIVE 1', 'BYNAVN=']
		const result = ParseCue(cueAdLib)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.AdLib,
				variant: 'MORBARN',
				inputs: { INP1: 'LIVE 1' }
			})
		)
	})

	test('AdLib Server', () => {
		const cueAdLib = ['ADLIBPIX=server']
		const result = ParseCue(cueAdLib)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.AdLib,
				variant: 'server',
				inputs: {}
			})
		)
	})

	test('Kommando', () => {
		const cueKommando = ['KOMMANDO=GRAPHICSPROFILE', 'TV2 SPORT 2016', ';0.00']
		const result = ParseCue(cueKommando)
		expect(result).toEqual(
			literal<CueDefinition>({
				type: CueType.Profile,
				start: {
					seconds: 0
				},
				profile: 'TV2 SPORT 2016'
			})
		)
	})

	test('SS=', () => {
		// TODO: Screen type
		const cueSS = ['SS=3-SPORTSDIGI', 'INP1=EVS 1', ';0.00.01']
		const result = ParseCue(cueSS)
		expect(result).toEqual(
			literal<CueDefinitionUnknown>({
				type: CueType.Unknown,
				start: {
					seconds: 0,
					frames: 1
				}
			})
		)
	})

	test('LYD', () => {
		const cueLYD = ['LYD=SPORT_BED', ';0.35']
		const result = ParseCue(cueLYD)
		expect(result).toEqual(
			literal<CueDefinitionLYD>({
				type: CueType.LYD,
				start: {
					seconds: 35
				},
				variant: 'SPORT_BED'
			})
		)
	})

	test('JINGLE', () => {
		const cueJingle = ['JINGLE2=SN_intro_19']
		const result = ParseCue(cueJingle)
		expect(result).toEqual(
			literal<CueDefinitionJingle>({
				type: CueType.Jingle,
				clip: 'SN_intro_19'
			})
		)
	})
})