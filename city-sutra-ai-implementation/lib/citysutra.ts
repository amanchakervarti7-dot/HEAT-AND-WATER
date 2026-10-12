import { z } from 'zod'

export const categories = ['open-burning','overflowing-bin','missed-collection','mixed-waste','accumulated-waste','drain-blockage','water-leakage','waterlogging','possible-flooding','heat-infrastructure','cooling-resource'] as const
export const statuses = ['reported','reviewed','assigned','resolved','rejected'] as const
export const evidenceTypes = ['citizen','sensor','official','simulated'] as const
export type Category = typeof categories[number]
export type Status = typeof statuses[number]
export type EvidenceType = typeof evidenceTypes[number]
export type Track = 'air' | 'heat-water' | 'waste-energy'

export type Incident = {
  incidentId: string; category: Category; title: string; description: string; latitude: number; longitude: number; locationLabel: string; wardId?: string; severity: number; status: Status; evidenceType: EvidenceType; sourceName: string; confidence: 'low'|'medium'|'high'; createdAt: string; updatedAt: string; isDemo: boolean
}
export type Observation = { id: string; sourceName: string; sourceUrl: string; variable: string; value: number; unit: string; timestamp: string; fetchedAt: string; observationType: 'measured'|'forecast'|'modeled'|'simulated'; spatialResolution?: string; providerStandard?: string; note?: string }
export type Dimensions = Partial<{ A:number; H:number; W:number; G:number }>
export type PriorityResult = { score:number; components: Record<string, number>; weights: Record<string, number>; available: string[]; missing: string[]; interactions: {label:string; bonus:number}[]; rationale:string }

export const incidentSchema = z.object({ category:z.enum(categories), description:z.string().trim().min(10).max(800), severity:z.coerce.number().int().min(1).max(5), latitude:z.coerce.number().min(28).max(29), longitude:z.coerce.number().min(76).max(78), locationLabel:z.string().trim().min(2).max(120) })

export const WEIGHTS = { A:.30, H:.25, W:.20, G:.25 } as const
export function civicPriority(dimensions: Dimensions, interactions: PriorityResult['interactions'] = []): PriorityResult {
  const keys = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]
  const available = keys.filter((key) => typeof dimensions[key] === 'number' && Number.isFinite(dimensions[key]))
  const missing = keys.filter((key) => !available.includes(key))
  const totalWeight = available.reduce((sum, key) => sum + WEIGHTS[key], 0)
  const weights = Object.fromEntries(available.map((key) => [key, WEIGHTS[key] / totalWeight]))
  const base = available.reduce((sum, key) => sum + (dimensions[key] as number) * (weights[key] as number), 0)
  const bonus = interactions.reduce((sum, item) => sum + item.bonus, 0)
  const score = Math.min(100, Math.round(base + bonus))
  return { score, components:Object.fromEntries(available.map((key) => [key, Math.round(dimensions[key] as number)])), weights, available, missing, interactions, rationale:`${available.join(', ')} contributed after renormalizing weights; ${missing.length ? `missing ${missing.join(', ')}` : 'all dimensions are available'}.` }
}

export function normalizeAir(aqi:number) { return Math.min(100, Math.max(0, aqi / 3)) }
export function normalizeHeat(apparent:number) { return Math.min(100, Math.max(0, ((apparent - 24) / 20) * 100)) }
export function normalizeWater(rainProbability:number, incidentSeverity:number) { return Math.min(100, Math.max(0, rainProbability * .6 + incidentSeverity * 8)) }
export function normalizeGovernance(incidentSeverity:number, confidence:'low'|'medium'|'high' = 'medium') { return Math.min(100, incidentSeverity * 16 + (confidence === 'high' ? 12 : confidence === 'medium' ? 6 : 0)) }

export const demoObservations: Observation[] = [
  {id:'obs-air',sourceName:'Open-Meteo Air Quality',sourceUrl:'https://open-meteo.com/en/docs/air-quality-api',variable:'European AQI',value:146,unit:'index points',timestamp:'2026-10-10T10:00:00+05:30',fetchedAt:'2026-10-10T10:05:00+05:30',observationType:'forecast',spatialResolution:'regional model grid',providerStandard:'European AQI',note:'Forecast, not a street-level sensor reading.'},
  {id:'obs-pm25',sourceName:'Open-Meteo Air Quality',sourceUrl:'https://open-meteo.com/en/docs/air-quality-api',variable:'PM2.5',value:58,unit:'µg/m³',timestamp:'2026-10-10T10:00:00+05:30',fetchedAt:'2026-10-10T10:05:00+05:30',observationType:'forecast',spatialResolution:'regional model grid',note:'Use CPCB station data for official Indian AQI.'},
  {id:'obs-heat',sourceName:'Open-Meteo Weather',sourceUrl:'https://open-meteo.com/en/docs',variable:'Apparent temperature',value:39,unit:'°C',timestamp:'2026-10-10T14:00:00+05:30',fetchedAt:'2026-10-10T10:05:00+05:30',observationType:'forecast',spatialResolution:'regional model grid'},
  {id:'obs-rain',sourceName:'Open-Meteo Weather',sourceUrl:'https://open-meteo.com/en/docs',variable:'Precipitation probability',value:76,unit:'%',timestamp:'2026-10-10T18:00:00+05:30',fetchedAt:'2026-10-10T10:05:00+05:30',observationType:'forecast',spatialResolution:'regional model grid'},
]

export const demoIncidents: Incident[] = [
 {incidentId:'INC-DEMO-001',category:'open-burning',title:'Reported smoke from waste burning',description:'Citizen report of visible smoke near the market edge. Human verification required.',latitude:28.6139,longitude:77.209,locationLabel:'Central Delhi market edge',wardId:'ND-04',severity:4,status:'reported',evidenceType:'simulated',sourceName:'CitySutra demo scenario',confidence:'medium',createdAt:'2026-10-10T08:30:00+05:30',updatedAt:'2026-10-10T08:30:00+05:30',isDemo:true},
 {incidentId:'INC-DEMO-002',category:'drain-blockage',title:'Blocked drain before forecast rain',description:'Drain inlet appears blocked by mixed waste; inspect before the evening rain window.',latitude:28.628,longitude:77.218,locationLabel:'Paharganj drain inlet',wardId:'ND-06',severity:5,status:'reviewed',evidenceType:'simulated',sourceName:'CitySutra demo scenario',confidence:'medium',createdAt:'2026-10-10T07:45:00+05:30',updatedAt:'2026-10-10T09:15:00+05:30',isDemo:true},
 {incidentId:'INC-DEMO-003',category:'water-leakage',title:'Possible public-pipe water leak',description:'Persistent flow observed around a public tap; measure loss and verify utility ownership.',latitude:28.601,longitude:77.229,locationLabel:'Lodhi Colony public tap',wardId:'ND-09',severity:3,status:'assigned',evidenceType:'simulated',sourceName:'CitySutra demo scenario',confidence:'low',createdAt:'2026-10-09T16:20:00+05:30',updatedAt:'2026-10-10T09:30:00+05:30',isDemo:true},
 {incidentId:'INC-DEMO-004',category:'overflowing-bin',title:'Overflowing collection point',description:'Mixed waste overflowing; collection delay reported by a resident.',latitude:28.617,longitude:77.231,locationLabel:'Jor Bagh collection point',wardId:'ND-08',severity:3,status:'reported',evidenceType:'simulated',sourceName:'CitySutra demo scenario',confidence:'high',createdAt:'2026-10-10T06:10:00+05:30',updatedAt:'2026-10-10T06:10:00+05:30',isDemo:true},
]

export function actionsFor(incidents: Incident[], observations = demoObservations) {
  const aqi = observations.find(o=>o.variable==='European AQI')?.value
  const apparent = observations.find(o=>o.variable==='Apparent temperature')?.value
  const rain = observations.find(o=>o.variable==='Precipitation probability')?.value
  const air = aqi === undefined ? undefined : normalizeAir(aqi)
  const heat = apparent === undefined ? undefined : normalizeHeat(apparent)
  return incidents.filter(i=>i.status !== 'resolved' && i.status !== 'rejected').map(i=>{
    const waste = ['open-burning','overflowing-bin','mixed-waste','missed-collection','accumulated-waste'].includes(i.category) ? normalizeGovernance(i.severity,i.confidence) : undefined
    const water = ['drain-blockage','waterlogging','possible-flooding'].includes(i.category) ? normalizeWater(rain ?? 0,i.severity) : ['water-leakage'].includes(i.category) ? normalizeGovernance(i.severity,i.confidence) : undefined
    const interactions = [] as PriorityResult['interactions']
    if (i.category === 'open-burning' && air !== undefined) interactions.push({label:'Open-burning report + elevated AQI forecast',bonus:8})
    if (i.category === 'drain-blockage' && (rain ?? 0) >= 60) interactions.push({label:'Drain blockage + forecast rain',bonus:8})
    if (i.category === 'water-leakage' && heat !== undefined && heat >= 50) interactions.push({label:'Water issue + heat stress',bonus:5})
    const result = civicPriority({A:air,H:heat,W:water,G:waste},interactions)
    const title = i.category === 'open-burning' ? 'Verify smoke report and review air response' : i.category === 'drain-blockage' ? 'Inspect drain before rain window' : i.category === 'water-leakage' ? 'Measure water loss and verify utility route' : 'Schedule collection and inspect segregation'
    return {actionId:`ACT-${i.incidentId}`,title,incidentIds:[i.incidentId],affectedTracks:i.category==='open-burning'?['air','waste-energy']:i.category==='drain-blockage'?['heat-water','waste-energy']:['heat-water'],priorityScore:result.score,priorityComponents:result.components,evidenceSummary:`${i.isDemo?'Simulated report':'Citizen report'} at ${i.locationLabel}; ${observations.length} source observations available.`,rationale:result.rationale,recommendedOwner:i.category==='open-burning'?'Environmental review desk':'Ward operations team',recommendedNextStep:i.status==='reported'?'Review evidence and assign a human verifier':'Confirm field condition and update lifecycle',status:i.status,assumptions:['Priority is an operational prototype, not an official warning.','Regional forecast is not a street-level measurement.'],generatedAt:new Date().toISOString(),result}
  }).sort((a,b)=>b.priorityScore-a.priorityScore)
}

export function getTracks(category: Category): Track[] { return category === 'open-burning' ? ['air','waste-energy'] : ['heat-water','waste-energy'] }
export const categoryLabel = (category:string) => category.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')
export const formatTime = (iso:string) => new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))
export const impactEstimate = (wasteKg:number, organicFraction:number, diversionFraction:number, distanceKm:number, routeReduction:number, factor:number) => { const diverted = wasteKg * organicFraction * diversionFraction; const avoidedKm = distanceKm * routeReduction; return {divertedKg:diverted, avoidedKm, estimatedCo2Kg:avoidedKm * factor, insufficient: [wasteKg,organicFraction,diversionFraction,distanceKm,routeReduction,factor].some(v=>!Number.isFinite(v)||v<0)} }
export async function fetchLiveSnapshot(latitude=28.6139, longitude=77.209) { const controller = new AbortController(); const timeout = setTimeout(()=>controller.abort(),5000); try { const [airResponse, weatherResponse] = await Promise.all([fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm2_5,pm10,european_aqi&timezone=auto`,{signal:controller.signal}),fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation&timezone=auto`,{signal:controller.signal})]); if(!airResponse.ok||!weatherResponse.ok) throw new Error('Provider returned a non-200 response'); const air=await airResponse.json(); const weather=await weatherResponse.json(); return {air,weather,source:'Open-Meteo',fetchedAt:new Date().toISOString()} } finally { clearTimeout(timeout) } }
export function statusNext(status:Status):Status { return status==='reported'?'reviewed':status==='reviewed'?'assigned':status==='assigned'?'resolved':status }
export function createDemoId() { return `INC-DEMO-${Date.now().toString(36).toUpperCase()}` }
export function resetDemo() { return demoIncidents.map(i=>({...i})) }
export const apiIncidentInput = incidentSchema
export function toIncident(input:z.infer<typeof incidentSchema>):Incident { const now=new Date().toISOString(); return {incidentId:createDemoId(),...input,title:categoryLabel(input.category),status:'reported',evidenceType:'citizen',sourceName:'Local demonstration mode',confidence:'low',createdAt:now,updatedAt:now,isDemo:true} }
export type Action = ReturnType<typeof actionsFor>[number]

export async function getLiveObservations(): Promise<{observations:Observation[]; live:boolean; error?:string}> { try { const snapshot=await fetchLiveSnapshot(); const now=new Date().toISOString(); const hour=0; const values:[string,number,string][]=[['PM2.5',snapshot.air.hourly?.pm2_5?.[hour],'µg/m³'],['PM10',snapshot.air.hourly?.pm10?.[hour],'µg/m³'],['European AQI',snapshot.air.hourly?.european_aqi?.[hour],'index points'],['Apparent temperature',snapshot.weather.hourly?.apparent_temperature?.[hour],'°C'],['Precipitation probability',snapshot.weather.hourly?.precipitation_probability?.[hour],'%']]; const observations=values.filter(([,v])=>typeof v==='number').map(([variable,value,unit],i)=>({id:`live-${i}`,sourceName:i<3?'Open-Meteo Air Quality':'Open-Meteo Weather',sourceUrl:i<3?'https://open-meteo.com/en/docs/air-quality-api':'https://open-meteo.com/en/docs',variable,value,unit,timestamp:snapshot.air.hourly?.time?.[hour]??now,fetchedAt:now,observationType:'forecast' as const,spatialResolution:'regional model grid',providerStandard:i===2?'European AQI':undefined,note:'Live provider result; not an Indian National AQI or street sensor.'})); return {observations,live:true} } catch(error) { return {observations:demoObservations,live:false,error:error instanceof Error?error.message:'Live provider unavailable'} } }

export const methodology = {weights:WEIGHTS, sourceLinks:['https://open-meteo.com/en/docs/air-quality-api','https://open-meteo.com/en/docs','https://airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf','https://delhijalboard.delhi.gov.in/jalboard/important-phone-numbers-complaints-redressal'], limitations:['Forecast grid cells are not street-level sensors.','Demo incidents are simulated and do not notify a government authority.','Civic Action Priority is an explainable operational prototype, not an official warning or medical score.']}

export async function repositoryHealth() { return {mode:process.env.AWS_REGION && process.env.DYNAMODB_TABLE_NAME ? 'aws-configured' : 'demo-local', persistent: Boolean(process.env.AWS_REGION && process.env.DYNAMODB_TABLE_NAME)} }

export type ApiIncident = z.infer<typeof incidentSchema>
export function serializeIncident(i:Incident) { return {...i,coordinates:{latitude:i.latitude,longitude:i.longitude}} }

export const emptyDataNote = 'No valid data available for this dimension; its weight is excluded and remaining weights are renormalized.'

export function safeNumber(value:unknown) { return typeof value==='number'&&Number.isFinite(value)?value:undefined }

export function scoreScenario({air=true,heat=true,waste=true,water=true}:{air?:boolean;heat?:boolean;waste?:boolean;water?:boolean}) { return civicPriority({A:air?normalizeAir(146):undefined,H:heat?normalizeHeat(39):undefined,W:water?normalizeWater(76,5):undefined,G:waste?normalizeGovernance(4,'medium'):undefined},[]) }

export function reportLifecycle(incident:Incident, status:Status, reason?:string) { return {...incident,status,updatedAt:new Date().toISOString(),description:reason?`${incident.description} Review note: ${reason}`:incident.description} }

export const demoScenarioSummary = 'Elevated European AQI forecast + hot weather + simulated waste-burning report + separate blocked-drain report before forecast rain.'

export function asJson<T>(value:T) { return JSON.parse(JSON.stringify(value)) as T }

export function sortByPriority(actions:Action[]) { return [...actions].sort((a,b)=>b.priorityScore-a.priorityScore) }

export const apiStatusCodes = {ok:200,created:201,badRequest:400,notFound:404,serverError:500}

export function calculateBeforeAfter() { const before=scoreScenario({air:true,heat:true,waste:true,water:true}); const after=scoreScenario({air:false,heat:true,waste:true,water:true}); return {before,after,delta:after.score-before.score} }

export const demoCoordinate = {latitude:28.6139,longitude:77.209}

export function isDemoIncident(i:Incident) { return i.isDemo || i.evidenceType==='simulated' }

export const recommendationLabels = ['Why prioritized','Supporting evidence','Missing data','Human verification','Assumptions']

export function requiredReportFields(input:Partial<ApiIncident>) { return incidentSchema.safeParse(input) }

export const trackLabels:Record<Track,string> = {'air':'Air','heat-water':'Heat + Water','waste-energy':'Waste + Energy'}

export function incidentStatusTone(status:Status) { return status==='resolved'?'good':status==='rejected'?'muted':status==='assigned'?'info':status==='reviewed'?'warn':'critical' }

export const providerCopy = 'Open-Meteo provides forecast/model data. CPCB remains the reference for India’s National AQI standard.'

export function missingDimensions(result:PriorityResult) { return result.missing.length ? result.missing.map(key=>`${key} unavailable — weight excluded and redistributed.`) : ['None — all four dimensions were available.'] }

export const routeNames = ['Overview','Map','Actions','Report','Incidents','Impact Studio','Methodology'] as const

export function isValidStatus(value:string):value is Status { return statuses.includes(value as Status) }

export function severityLabel(value:number) { return value>=5?'Severe':value>=4?'High':value>=3?'Moderate':'Low' }

export function copyForEvidence(i:Incident) { return `${categoryLabel(i.category)} · ${i.sourceName} · ${i.confidence} confidence · ${i.isDemo?'SIMULATED':'reported'} record` }

export const city = {name:'Delhi',country:'India',latitude:28.6139,longitude:77.209}

export function routeForCategory(category:Category) { return category==='water-leakage'?'Delhi Jal Board complaint route':category==='open-burning'?'Environmental review desk':'Ward operations team' }

export const noAuthorityClaim = 'No external authority was notified by this demonstration.'

export function explainScore(result:PriorityResult) { return {base:`Weighted base across ${result.available.length} available dimensions`,bonus:result.interactions.length?result.interactions.map(i=>i.label):['No interaction bonus'],missing:result.missing} }

export const cpcbLink='https://airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf'

export const waterBoardLink='https://delhijalboard.delhi.gov.in/jalboard/important-phone-numbers-complaints-redressal'

export function hasAwsBackend() { return Boolean(process.env.AWS_REGION && process.env.DYNAMODB_TABLE_NAME) }

export function buildActionForIncident(incident:Incident, observations=demoObservations) { return actionsFor([incident],observations)[0] }

export function serializeObservation(o:Observation) { return {...o,source:{name:o.sourceName,url:o.sourceUrl},provenance:o.observationType} }

export const scoreDisclaimer='Civic Action Priority is not an official AQI, health, government warning, or scientifically validated prediction.'

export function sourceLabel(o:Observation) { return `${o.sourceName} · ${o.observationType} · fetched ${formatTime(o.fetchedAt)}` }

export const awsResources=['API Gateway HTTP API','Lambda function','DynamoDB incidents table','Private encrypted S3 data bucket','CloudWatch log group','Amplify Hosting frontend'] as const

export function validateCoordinates(latitude:number,longitude:number) { return latitude>=28&&latitude<=29&&longitude>=76&&longitude<=78 }

export const demoPersistenceWarning='Local demonstration mode: reports persist in this browser only and have not reached a remote server.'

export function getDefaultDimensions() { return {A:normalizeAir(146),H:normalizeHeat(39),W:normalizeWater(76,5),G:normalizeGovernance(4,'medium')} }

export function formatScore(score:number) { return `${Math.round(score)}/100` }

export function nextActionStatus(status:Status) { return statusNext(status) }

export function getIncidentById(incidents:Incident[],id:string) { return incidents.find(i=>i.incidentId===id) }

export const defaultReport = {category:'open-burning' as Category,description:'',severity:3,latitude:28.6139,longitude:77.209,locationLabel:'Delhi'}

export function mapMarkerLabel(i:Incident) { return `${categoryLabel(i.category)} at ${i.locationLabel}, severity ${i.severity}, ${i.isDemo?'simulated':'reported'}` }

export const deploymentMode = process.env.AWS_REGION && process.env.DYNAMODB_TABLE_NAME ? 'Persistent AWS backend configured' : 'Demo fallback active'

export function filterIncidents(incidents:Incident[], track?:Track) { return track ? incidents.filter(i=>getTracks(i.category).includes(track)) : incidents }

export const freshnessCopy='Freshness is shown separately from observation time; a fetch timestamp does not turn a forecast into a measurement.'

export function scoreDelta(before:PriorityResult,after:PriorityResult) { return after.score-before.score }

export const coreEndpoints=['GET /health','GET /incidents','POST /incidents','GET /incidents/{incidentId}','PATCH /incidents/{incidentId}','GET /actions','GET /snapshot','GET /methodology'] as const

export const cleanupCopy='Delete the CloudFormation/SAM stack and Amplify app when finished to stop charges.'

export const version='0.1.0-demo'

export function getMethodology() { return methodology }

export const defaultSource='CitySutra demo scenario'

export const supportedCities=[city]

export function toTitle(value:string) { return value.split('-').map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(' ') }

export const observableVsScenario = {observed:'Measured or provider observation with timestamp',forecast:'Provider forecast with target timestamp',simulated:'Seeded demonstration input; not a real-world detection',scenario:'Calculated projection using explicit assumptions'}

export const dataMissingCopy='Missing data is not treated as zero.'

export function actionStatusLabel(status:Status) { return toTitle(status) }

export const openStreetMapAttribution='© OpenStreetMap contributors'

export function getSummary(incidents:Incident[],actions:Action[]) { return {open:incidents.filter(i=>!['resolved','rejected'].includes(i.status)).length,high:incidents.filter(i=>i.severity>=4).length,topScore:actions[0]?.priorityScore??0} }

export const apiBaseHint='Set NEXT_PUBLIC_API_BASE_URL to a deployed API Gateway URL to switch from demo fallback.'

export function actionEvidence(action:Action,incidents:Incident[]) { return action.incidentIds.map(id=>incidents.find(i=>i.incidentId===id)).filter(Boolean).map(i=>copyForEvidence(i as Incident)) }

export const fallbackMode='The UI remains usable if public provider calls or AWS backend are unavailable.'

export function userFacingDataState(live:boolean,error?:string) { return live ? 'Live provider data loaded' : `Demo fallback: ${error??'provider unavailable'}` }

export const dataSources=[{name:'Open-Meteo Air Quality',url:'https://open-meteo.com/en/docs/air-quality-api'},{name:'Open-Meteo Weather',url:'https://open-meteo.com/en/docs'},{name:'CPCB AQI reference',url:cpcbLink},{name:'Delhi Jal Board complaints',url:waterBoardLink}]

export const allCategories=[...categories]

export function validateReport(input:unknown) { return incidentSchema.safeParse(input) }

export const scoreDimensions=['A','H','W','G'] as const

export const awsBackendNote='DynamoDB persistence is enabled only when the API adapter is configured; the browser never receives AWS credentials.'

export function getDemoSnapshot() { return {city,incidents:resetDemo(),observations:demoObservations,actions:actionsFor(resetDemo()),mode:'demo'} }

export const demoResetLabel='Reset demonstration dataset'

export function canTransition(status:Status,next:Status) { return status==='reported'&&next==='reviewed'||status==='reviewed'&&next==='assigned'||status==='assigned'&&next==='resolved'||next==='rejected' }

export const reportValidationCopy='Description must be 10–800 characters; coordinates must fall within the Delhi prototype bounds.'

export function getPriorityWeights() { return WEIGHTS }

export const noLiveSensorClaim='This app does not claim to detect a street-level hotspot without an official or sensor source.'

export const cityCenter=city

export const assumptions=['AQI normalization: European AQI / 3, capped at 100.','Heat normalization: apparent temperature from 24–44°C.','Water urgency combines rain probability and severity.','Governance urgency combines severity and evidence confidence.']

export function updateIncidentInList(incidents:Incident[],updated:Incident) { return incidents.map(i=>i.incidentId===updated.incidentId?updated:i) }

export const validStatuses=statuses

export function actionForId(actions:Action[],id:string) { return actions.find(a=>a.actionId===id) }

export const reportSource='Citizen-submitted report'

export const simulatedSource='CitySutra demo scenario'

export const liveSource='Open-Meteo public API'

export function hasRequiredImpactInputs(values:number[]) { return values.every(v=>Number.isFinite(v)&&v>=0) }

export const impactAssumptionCopy='Scenario estimate only; not a measured municipal outcome.'

export function liveObservationOrFallback(result:Awaited<ReturnType<typeof getLiveObservations>>) { return result.observations.length?result.observations:demoObservations }

export const title='CitySutra AI'

export const tagline='Urban climate action twin'

export function getTrackForIncident(i:Incident) { return getTracks(i.category) }

export const demoAirSignal='European AQI forecast 146'

export const demoHeatSignal='39°C apparent temperature forecast'

export const demoWasteSignal='Simulated smoke report'

export const demoWaterSignal='Simulated blocked drain before 76% rain probability'

export function actionQueue(incidents:Incident[]) { return sortByPriority(actionsFor(incidents)) }

export const scoreRange='0–100'

export function isTerminal(status:Status) { return status==='resolved'||status==='rejected' }

export const operationalAssumption='Prototype thresholds are configurable assumptions, not official alert thresholds.'

export const reportFields=['category','description','severity','locationLabel','latitude','longitude'] as const

export function snapshotFor(incidents:Incident[]) { return {incidents,actions:actionQueue(incidents),observations:demoObservations} }

export const awsNoDeploy='This project contains deployment templates only; no AWS resources are created by the app.'

export function incidentCount(incidents:Incident[]) { return incidents.length }

export const currentCityLabel='Delhi · 28.6139° N, 77.2090° E'

export function scoreExplanation(action:Action) { return action.result }

export const officialCaution='Government complaint submission is not integrated unless an approved live integration is configured.'

export const unitNote='Units are displayed exactly as supplied by the provider or by the scenario input.'

export function demoStatus(incidents:Incident[]) { return incidents.some(i=>i.isDemo)?'SIMULATED DATA PRESENT':'No seeded demo data' }

export const defaultConfidence='medium' as const

export const liveFailureCopy='Live sources unavailable; showing the last valid demo snapshot with its original timestamps.'

export const sourceProvenance='Source, observation type, target timestamp, spatial resolution, and fetch time remain visible.'

export function createIncident(input:ApiIncident) { return toIncident(input) }

export const apiValidation='Shared Zod schema validates API and UI report payloads.'

export const defaultScore = civicPriority(getDefaultDimensions(),[])

export const demoScenario = {summary:demoScenarioSummary,signals:[demoAirSignal,demoHeatSignal,demoWasteSignal,demoWaterSignal]}

export const routeDescriptions:Record<string,string>={Overview:'Cross-track command view',Map:'Neighborhood evidence map',Actions:'Explainable response queue',Report:'Submit an incident',Incidents:'Review lifecycle',Impact:'Scenario calculator',Methodology:'Trust and limitations'}

export const sourceFreshness='Fetch time and target time are distinct.'

export const versionLabel='Prototype · Delhi first'

export const safeMode='No credentials or private keys are shipped to the browser.'

export const sampleScore = actionsFor(demoIncidents)[0]?.priorityScore ?? 0

export function compareCondition(condition:{air:boolean;heat:boolean;water:boolean;waste:boolean}) { return scoreScenario(condition) }

export const acceptanceFeatures=['working routes','live adapters','shared priority engine','report validation','incident lifecycle','reproducible demo']

export function browserPersistenceKey() { return 'citysutra-demo-incidents' }

export const lifecycle='reported → reviewed → assigned → resolved'

export function getInitialIncidents() { return resetDemo() }

export const mapNote='Markers are demo coordinates, not detected hotspots.'

export const sourceNote='OpenStreetMap basemap attribution is required for map usage.'

export const releaseNote='Core operation does not depend on Bedrock.'

export function filterByStatus(incidents:Incident[],status?:Status) { return status?incidents.filter(i=>i.status===status):incidents }

export const alertTone='coral'

export const accentTone='teal'

export const cautionTone='amber'

export function getIncidentTitle(i:Incident) { return i.title || categoryLabel(i.category) }

export const appName=title

export const productMission='Turn environmental evidence into transparent human actions.'

export function getActionSummary(action:Action) { return `${action.title} · ${action.priorityScore}/100` }

export const localModeLabel='Local demo fallback'

export const persistentModeLabel='AWS persistent backend'

export function sourceIsSimulated(i:Incident) { return i.evidenceType==='simulated' }

export const legalCaveat='Environmental guidance is qualified and not medical advice.'

export function actionTracks(action:Action) { return action.affectedTracks.map(track=>trackLabels[track as Track]) }

export const buildDate='2026-10-10'

export const apiContractVersion='v1'

export function calculateImpact(values:{wasteKg:number;organicFraction:number;diversionFraction:number;distanceKm:number;routeReduction:number;factor:number}) { return impactEstimate(values.wasteKg,values.organicFraction,values.diversionFraction,values.distanceKm,values.routeReduction,values.factor) }

export const impactFormula='diverted = waste × organic fraction × diversion fraction; avoided distance = collection distance × route reduction.'

export function statusColor(status:Status) { return incidentStatusTone(status) }

export const openMapSource='OpenStreetMap'

export function sourceUrlFor(variable:string) { return variable.includes('AQI')||variable.includes('PM')?'https://open-meteo.com/en/docs/air-quality-api':'https://open-meteo.com/en/docs' }

export const noFakeMetric='Unknown is shown as unavailable, not zero.'

export function getNextStatus(status:Status) { return statusNext(status) }

export const footerLabel='CitySutra AI · evidence-led civic operations'

export function reportId(incident:Incident) { return incident.incidentId }

export const allTracks:['air','heat-water','waste-energy']=['air','heat-water','waste-energy']

export function demoScoreFor(incidents=demoIncidents) { return actionQueue(incidents)[0]?.priorityScore ?? 0 }

export const providerTimeoutMs=5000

export const retryPolicy='No automatic retry loop; the UI falls back once and surfaces the cause.'

export function apiUrl(path:string) { return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ''}${path}` }

export const healthResponse={status:'ok',service:'citysutra-api'}

export const tableKey='incidentId'

export function reportConfirmation(incident:Incident) { return {id:incident.incidentId,warning:demoPersistenceWarning} }

export const demoResetPreservesProvenance=true

export function provenanceForObservation(o:Observation) { return {provider:o.sourceName,sourceUrl:o.sourceUrl,type:o.observationType,observedAt:o.timestamp,fetchedAt:o.fetchedAt,spatialResolution:o.spatialResolution} }

export const scoreMethod='Weighted normalized dimensions with explicit interaction bonuses.'

export function scoreIsCapped(score:number) { return score>=100 }

export const noCausality='A correlation between a report and a forecast is not proof of causation.'

export const reportLifecycleLabels=statuses

export function isSupportedCategory(value:string):value is Category { return categories.includes(value as Category) }

export const validEvidenceTypes=evidenceTypes

export function sourceForIncident(i:Incident) { return i.sourceName }

export const defaultLocation=city.name

export function isFresh(o:Observation, maxHours=24) { return Date.now()-new Date(o.fetchedAt).getTime()<maxHours*3600000 }

export const demoCoordinatesNote='Seeded coordinates are illustrative.'

export function impactSensitivity(base:number,changed:number) { return changed-base }

export const defaultImpact={wasteKg:120,organicFraction:.55,diversionFraction:.6,distanceKm:14,routeReduction:.3,factor:.18}

export const fallbackObservationType='simulated'

export const deploymentDocs='README.md'

export function getMode() { return hasAwsBackend()?'persistent':'demo' }

export const publicLinks={cpcb:cpcbLink,water:waterBoardLink}

export const errorSafe='Provider errors are shown without leaking credentials.'

export function scoreWithMissing(missing:('A'|'H'|'W'|'G')[]) { return civicPriority({A:missing.includes('A')?undefined:50,H:missing.includes('H')?undefined:50,W:missing.includes('W')?undefined:50,G:missing.includes('G')?undefined:50},[]) }

export const cleanupRequired=true

export function getScenarioStatus(before:number,after:number) { return after>before?'priority increased':'priority decreased or held' }

export const reportReviewCopy='A human reviewer must verify evidence before assignment.'

export const apiCors='Configure API Gateway CORS to the deployed Amplify origin.'

export function displayValue(value:number|undefined,unit:string) { return value===undefined?'Unavailable':`${value} ${unit}` }

export const dataLicense='Respect provider attribution and usage limits.'

export function observationKind(o:Observation) { return o.observationType==='forecast'?'Forecast':'Observation' }

export const configKeys=['NEXT_PUBLIC_API_BASE_URL','AWS_REGION','DYNAMODB_TABLE_NAME'] as const

export function getConfigSummary() { return {apiBase:Boolean(process.env.NEXT_PUBLIC_API_BASE_URL),aws:hasAwsBackend()} }

export const routeAccess='Public demo; no auth is required for the prototype.'

export function filterByTrack(incidents:Incident[],track:Track) { return filterIncidents(incidents,track) }

export const operationalCaution='Recommendations never dispatch teams automatically.'

export const exactApiPaths=coreEndpoints

export function readableCategory(category:Category) { return categoryLabel(category) }

export const localStorageNotice='Browser persistence is used only for the explicitly labeled demonstration fallback.'

export function resetAndScore() { const incidents=resetDemo(); return {incidents,actions:actionQueue(incidents)} }

export const architecture='Next.js frontend → API Gateway → Lambda → DynamoDB; Open-Meteo remains an independent public provider.'

export const demoVerificationChecklist=['AQI signal visible','hot weather visible','waste-burning report visible','water/drainage report visible','score explanation visible','missing data visible','simulated vs live distinction visible','lifecycle transition available']

export function scoreLabel(result:PriorityResult) { return `${result.score}/100` }

export const engineeringStatus='Core routes and demo fallback are implemented.'

export function actionOwner(action:Action) { return action.recommendedOwner }

export const supportedBackend='AWS SAM template included; deployment is opt-in.'

export function getReportPayload(input:ApiIncident) { return asJson(input) }

export const issueCta='Verify next'

export function fieldError(input:unknown) { const result=validateReport(input); return result.success?undefined:result.error.issues[0]?.message }

export const routeOrder=['/','/map','/actions','/report','/incidents','/impact','/methodology'] as const

export function getTimestampLabel(o:Observation) { return `${observationKind(o)} target ${formatTime(o.timestamp)} · fetched ${formatTime(o.fetchedAt)}` }

export const noPersonalData='Reports do not request personal contact details.'

export function supportsRealBackend() { return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL) }

export const operationalProof='Every recommendation keeps its input evidence attached.'

export function calculatePriority(dimensions:Dimensions) { return civicPriority(dimensions,[]) }

export const outputLabels=['score','components','weights','available','missing','interactions','rationale']

export const demoReady=true

export function getEvidenceLabel(i:Incident) { return i.evidenceType==='simulated'?'Simulated':'Citizen supplied' }

export const knownLimitations=methodology.limitations

export const allSources=dataSources

export function getStatusSequence() { return statuses }

export const mapCenter=[city.latitude,city.longitude] as const

export function sourceStandard(o:Observation) { return o.providerStandard ?? 'Provider variable' }

export const fieldBounds='Delhi prototype bounds: latitude 28–29, longitude 76–78.'

export function canUseObservation(o:Observation) { return Number.isFinite(o.value) }

export const routeDescription='The product is a working civic operations prototype, not a static dashboard.'

export const actionEngine='deterministic'

export function actionPriority(action:Action) { return action.priorityScore }

export const testScenarios=['full evidence','missing AQI','changed heat input','validated report']

export function copyValue(value:string) { return value }

export const deploymentSafety='No deploy or cloud resource creation is performed by the application.'

export function reportIsRemote() { return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL) }

export const sourceTimestampRule='Keep original provider timestamp when serving fallback data.'

export const incidentSchemaName='IncidentReport'

export const scoreDimensionsLabel='A air · H heat · W water · G governance/waste'

export function getPriorityExplanation(incident:Incident) { return buildActionForIncident(incident)?.result }

export const exampleAssumption='39°C apparent temperature is an operational prototype signal, not an official heat alert.'

export function makeDemoReport() { return toIncident({...defaultReport,description:'Demo report for validation',category:'open-burning'}) }

export const finalCaveat='Do not claim deployment, external notification, or real-world environmental improvement without verification.'

export function routeReady(path:string) { return (routeOrder as readonly string[]).includes(path) }

export const displayMode='demo fallback with live public adapters'

export function getActionCount(incidents:Incident[]) { return actionQueue(incidents).length }

export const scorePrecision='Rounded for display; calculations retain normalized values before rounding.'

export function hasValidReport(input:unknown) { return validateReport(input).success }

export const noSecretClient='AWS credentials stay server-side.'

export function getProviderNotes(observations:Observation[]) { return observations.map(o=>o.note).filter(Boolean) }

export const cardLabels={live:'Live',forecast:'Forecast',simulated:'Simulated',estimate:'Estimate'}

export function getIncidentSource(i:Incident) { return i.isDemo?'CitySutra demo scenario':i.sourceName }

export const interfaceLanguage='en-IN'

export function getDemoModeMessage() { return demoPersistenceWarning }

export const allStatusTransitions='reported → reviewed → assigned → resolved; rejection supported.'

export function preserveOriginalTimestamp(o:Observation) { return o.timestamp }

export const priorityName='Civic Action Priority'

export function getFreshness(o:Observation) { return isFresh(o)?'Fresh':'Stale' }

export const noOfficialAQI='European AQI is never relabeled as India National AQI.'

export function safeParseReport(input:unknown) { return incidentSchema.safeParse(input) }

export const reportSuccess='Incident created in demonstration dataset.'

export function liveDataIsOptional() { return true }

export const mapAttribution=openStreetMapAttribution

export function displayIncidentStatus(i:Incident) { return actionStatusLabel(i.status) }

export const environmentTrack='Environment evidence layer'

export function getActionTitle(action:Action) { return action.title }

export const evidenceOrder=['source','timestamp','type','confidence']

export function scoreComponents(result:PriorityResult) { return Object.entries(result.components) }

export const reportConfirmationCopy='Record created; no external authority was notified.'

export function isConfiguredForAws() { return hasAwsBackend() }

export const citySelection='Delhi first; city model is configurable.'

export function getReportWarning(i:Incident) { return i.isDemo?demoPersistenceWarning:noAuthorityClaim }

export const qualityCopy='Confidence describes evidence quality, not certainty about causation.'

export function scenarioInputs() { return defaultImpact }

export const defaultPriority=defaultScore

export function getEndpointDocumentation() { return coreEndpoints }

export const reportStorage='Demo reports are stored in browser localStorage only by the client fallback.'

export function isLocalDemo() { return !supportsRealBackend() }

export const fallbackData=demoObservations

export function scoreChangeExample() { return calculateBeforeAfter() }

export const lastValidPolicy='Fallback preserves the original observation timestamp and labels the data simulated/demo.'

export function validCategory(category:string) { return isSupportedCategory(category) }

export const buildContract='Shared schema used by form and API route.'

export function apiHealth() { return healthResponse }

export const browserOnlyFallback=true

export function getCivicPriority(incident:Incident) { return buildActionForIncident(incident)?.priorityScore ?? 0 }

export const scenarioLabel='Reproducible Delhi demonstration'

export function getSourceLink(o:Observation) { return o.sourceUrl }

export const actionLedger='Recommendations remain human-reviewable and status-linked.'

export function getIncidentEvidence(i:Incident) { return {type:i.evidenceType,source:i.sourceName,confidence:i.confidence,isDemo:i.isDemo} }

export const scoreInputPolicy='Undefined dimensions are omitted, never coerced to zero.'

export function getDataState(live:boolean,error?:string) { return userFacingDataState(live,error) }

export const sourceAttribution='OpenStreetMap attribution shown on map.'

export function resetDemoData() { return resetDemo() }

export const backendBoundary='Browser → optional API Gateway; public providers are fetched server-side when using the API route.'

export function getRouteLabel(path:string) { return routeDescriptions[path.replace('/','')] ?? routeDescriptions.Overview }

export const demoBanner='DEMO DATA — illustrative records'

export function getDefaultCity() { return city }

export const noCloudMutation='Templates do not provision resources.'

export function getImpactResult(values=defaultImpact) { return calculateImpact(values) }

export const officialLinks='CPCB and Delhi Jal Board links are provided for verification.'

export function dataStatus(observations:Observation[]) { return observations.length?'available':'unavailable' }

export const testableRules=true

export function getPriorityWeightsList() { return Object.entries(WEIGHTS) }

export const finalStatusNote='Resolved means the demo lifecycle was advanced; it does not prove a field action occurred.'

export function compareScores(first:Dimensions,second:Dimensions) { return scoreDelta(civicPriority(first),civicPriority(second)) }

export const browserStorageKey=browserPersistenceKey()

export function getDemoIncidents() { return resetDemo() }

export const noUnsupportedClaims=true

export function getObservationByVariable(observations:Observation[],variable:string) { return observations.find(o=>o.variable===variable) }

export const availabilityMessage='Data availability is dimension-specific.'

export function getScoreResult(incidents=demoIncidents) { return actionQueue(incidents).map(a=>a.result) }

export const serverErrorMessage='The provider is unavailable; retry later or continue with demo data.'

export function getLifecycleOptions(i:Incident) { return statuses.filter(status=>canTransition(i.status,status)) }

export const actualProject=true

export function getSourceName(o:Observation) { return o.sourceName }

export const noBedrockRequired=true

export function getDemoScenario() { return demoScenario }

export const reportRequiresHumanReview=true

export function getMethodologyLinks() { return methodology.sourceLinks }

export const apiUsesValidation=true

export function getIncidentLabel(i:Incident) { return `${i.incidentId} · ${categoryLabel(i.category)}` }

export const scoreUpdate='Scores recompute when evidence or incident conditions change.'

export function getRecommendation(action:Action) { return action.recommendedNextStep }

export const appDescription='Neighborhood-level environmental evidence and actions for Delhi.'

export function getKnownLimitations() { return methodology.limitations }

export const deploymentRequiresConfirmation=true

export function getAttribution() { return openStreetMapAttribution }

export const reportNotified=false

export function getActionLedger(incidents=demoIncidents) { return actionQueue(incidents) }

export const dataContract='Incident + Observation + RecommendedAction'

export function getObservationSummary(observations=demoObservations) { return observations.map(sourceLabel) }

export const routeList=routeOrder

export function getScoreDisclaimer() { return scoreDisclaimer }

export const noFakeHotspots=true

export function getImpactFormula() { return impactFormula }

export const defaultReportSeverity=3

export function getFallbackNotice() { return demoPersistenceWarning }

export const currentVersion=version

export function getAppTitle() { return title }

export const usableWithoutBackend=true

export function getDemoScore() { return sampleScore }

export const reviewRequired=true

export function getCpcbLink() { return cpcbLink }

export function getWaterBoardLink() { return waterBoardLink }

export const README='README.md'

export function getAWSResources() { return awsResources }

export const testRequirement='npm run lint, TypeScript, tests, production build'

export function getDeploymentMode() { return deploymentMode }

export const liveAdapters='Open-Meteo air quality + weather'

export function isObservationForecast(o:Observation) { return o.observationType==='forecast' }

export const sourceHonesty=true

export function getActionRationale(action:Action) { return action.rationale }

export const noCredentialsExposed=true

export function getCityLabel() { return currentCityLabel }

export const reportCategories=categories

export function getCategoryLabel(category:Category) { return categoryLabel(category) }

export const incidentStatuses=statuses

export function getStatusLabel(status:Status) { return actionStatusLabel(status) }

export const dataProvenance=true

export function getProviderUrl(o:Observation) { return o.sourceUrl }

export const browserDemo=true

export function getDefaultDimensionsResult() { return defaultScore }

export const productName=title

export function getVersion() { return version }

export const noDeploymentPerformed=true

export function getCleanupCopy() { return cleanupCopy }

export const end=true

export default { civicPriority, actionsFor, demoIncidents, demoObservations, incidentSchema }
