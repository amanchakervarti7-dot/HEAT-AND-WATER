import { NextResponse } from 'next/server'
import { getDemoSnapshot, getLiveObservations } from '@/lib/citysutra'
export async function GET(){const live=await getLiveObservations();const snapshot=getDemoSnapshot();return NextResponse.json({...snapshot,observations:live.observations,live:live.live,error:live.error??null})}
