'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { ActionRow, DemoBanner, PageHeader, useShellState } from '@/components/citysutra-shell'
import { actionsFor } from '@/lib/citysutra'
export default function ActionsPage(){const {incidents,observations,update}=useShellState();const actions=useMemo(()=>actionsFor(incidents,observations),[incidents,observations]);return <><PageHeader eyebrow="Action ledger" title="Prioritized response queue" description="A deterministic score helps humans decide what to verify first. It never dispatches a team or claims an outcome." action={<Link href="/report" className="rounded-lg bg-[#123d43] px-3 py-2 text-xs font-semibold text-white">Add report</Link>}/><DemoBanner/><div className="mt-5 grid gap-3">{actions.map((action,index)=><ActionRow key={action.actionId} action={action} rank={index+1} incident={incidents.find(i=>i.incidentId===action.incidentIds[0])} onAdvance={update}/>)}</div></>}
