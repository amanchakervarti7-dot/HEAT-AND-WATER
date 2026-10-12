import { NextResponse } from 'next/server'
import { repositoryHealth } from '@/lib/citysutra'
export async function GET(){return NextResponse.json({status:'ok',...(await repositoryHealth())})}
