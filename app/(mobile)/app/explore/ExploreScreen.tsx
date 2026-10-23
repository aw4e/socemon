'use client'
import { useState } from 'react'
import { Briefcase, CalendarDays, Users } from 'lucide-react'
import { EventsSection } from '@/components/explore/EventsSection'
import { JobsSection } from '@/components/explore/JobsSection'
import { PeopleSection } from '@/components/explore/PeopleSection'
import type { DropInfo } from '@/components/explore/DropPoster'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'

type Section = 'events' | 'jobs' | 'people'

const SECTIONS: { key: Section; label: string; Icon: typeof Users }[] = [
  { key: 'events', label: 'Events', Icon: CalendarDays },
  { key: 'jobs', label: 'Jobs', Icon: Briefcase },
  { key: 'people', label: 'People', Icon: Users },
]

/* Explore: the live event's drop and the community's events, jobs and trainers in one tab. Modelled on Cardtena's Explore tab, with its own data. */
export function ExploreScreen({ drop }: { drop: DropInfo }) {
  const [section, setSection] = useState<Section>('events')

  return (
    <div>
      <PageHeader title="Explore" />
      <div role="tablist" aria-label="Explore sections" className="grid grid-cols-3 gap-1 p-1 mb-6 rounded-[20px] bg-bg-surface border-2 border-(--border-default)">
        {SECTIONS.map(({ key, label, Icon }) => {
          const active = section === key
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              id={`explore-tab-${key}`}
              aria-controls="explore-panel"
              onClick={() => setSection(key)}
              className={cn(
                'h-11 rounded-2xl inline-flex items-center justify-center gap-1.5 font-sans text-[13px] font-extrabold uppercase tracking-[0.05em] transition-[background-color,color] duration-150',
                active ? 'bg-primary text-primary-fg shadow-[0_3px_0_var(--primary-shadow)]' : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={active ? 2.6 : 2} />
              {label}
            </button>
          )
        })}
      </div>

      <div id="explore-panel" role="tabpanel" aria-labelledby={`explore-tab-${section}`}>
        {section === 'events' && <EventsSection drop={drop} />}
        {section === 'jobs' && <JobsSection />}
        {section === 'people' && <PeopleSection />}
      </div>
    </div>
  )
}
