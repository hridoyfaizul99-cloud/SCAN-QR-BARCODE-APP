import { Article } from '../types';

export const SAMPLE_ARTICLES: Article[] = [
  {
    id: 'sample-1',
    title: 'Next-Gen Solid-State Battery Clears High-Speed Railway Safety Tests',
    category: 'Clean Tech & Energy',
    priority: 'high',
    estimatedReadTimeMinutes: 3,
    addedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    sourceUrl: 'https://energytoday.example/solid-state-railway-milestone',
    content: `Engineers have successfully completed a 12-month commercial durability trial of solid-state ceramic electrolyte batteries powering express electric locomotives. The new cells demonstrate a 65% increase in energy density compared to traditional lithium-ion packs, eliminating the thermal runaway risks that have historically raised fire concerns in enclosed tunnels.

During accelerated stress testing exceeding 3,000 rapid recharge cycles at sub-zero temperatures, the pack retained 92% of its original capacity with negligible cell degradation. The European Rail Safety Agency granted provisional certification for passenger routes starting early next year.

Industry analysts forecast that replacing diesel-electric hybrids on non-electrified regional routes with solid-state battery rail cars will reduce operating costs by 34% per passenger kilometer. Several heavy freight transit networks in North America and East Asia are currently evaluating pilot conversions for urban freight corridors.`,
  },
  {
    id: 'sample-2',
    title: 'Autonomous Electric Transit Shuttles Roll Out Across 12 Commuter Hubs',
    category: 'Urban Mobility',
    priority: 'high',
    estimatedReadTimeMinutes: 4,
    addedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    sourceUrl: 'https://citytransit.example/autonomous-corridors-rollout',
    content: `Municipal transportation authorities in twelve metropolitan centers have initiated permanent autonomous electric shuttle networks connecting outer residential rail stations directly to central hospital and corporate employment campuses. The 16-passenger vehicles operate without on-board safety drivers, relying instead on high-definition LiDAR arrays and dedicated V2X (vehicle-to-everything) roadside sensors.

Initial rider surveys report 94% passenger satisfaction, with average wait times during peak morning commute windows dropping from 14 minutes down to under 4 minutes. Centralized remote dispatch supervisors monitor up to eight shuttles simultaneously from a regional control center.

Urban planners emphasize that these autonomous feeder loops solve the persistent 'first-mile, last-mile' transit bottleneck that previously pushed suburban commuters back into single-occupancy personal cars. The project was funded through combined clean infrastructure grants and municipal bond measures.`,
  },
  {
    id: 'sample-3',
    title: 'Frontier AI Reasoning Models Tackle Complex Enzyme Synthesis in Hours',
    category: 'Science & Biotech',
    priority: 'normal',
    estimatedReadTimeMinutes: 3,
    addedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    sourceUrl: 'https://biotechweekly.example/ai-enzyme-breakthrough',
    content: `Biomedical researchers at leading global institutes announced a breakthrough using advanced multi-step AI reasoning models to design synthetic enzymes capable of neutralizing environmental microplastics in industrial wastewater. Rather than relying on months of physical trial-and-error chemical synthesis, the model simulated biochemical folding stability and catalytic kinetics within six hours.

Laboratory validation confirmed that the computationally engineered biocatalyst decomposed polyethylene terephthalate (PET) polymers at room temperature four times faster than any previously documented natural bacterial enzyme.

The development signals a major turning point for green manufacturing and circular chemical economies. Pharmaceutical startups are now adapting the same reasoning architecture to target drug-resistant bacterial pathogens and customize targeted therapeutics for autoimmune disorders.`,
  },
  {
    id: 'sample-4',
    title: 'Global Remote & Commute Study: The "Productive Transit" Phenomenon',
    category: 'Workplace & Economy',
    priority: 'normal',
    estimatedReadTimeMinutes: 3,
    addedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    sourceUrl: 'https://worktrendslab.example/productive-transit-2026',
    content: `A comprehensive survey tracking 42,000 knowledge workers across North America, Europe, and Asia reveals a dramatic shift in how modern commuters utilize transit time. While long solo driving commutes continue to score highest on stress and cortisol measurements, train, bus, and rideshare commuters who intentionally listen to curated educational audio or podcasts report 28% higher morning clarity and job focus.

The report notes that hybrid office policies (typically 2-3 days in office) have transformed the commute from a daily chore into a deliberate 'cognitive threshold'—a transitional buffer between household responsibilities and workplace execution.

Employers who sponsor transit passes and curated audio learning subscriptions observed higher retention and lower burnout among junior and mid-level employees.`,
  },
  {
    id: 'sample-5',
    title: 'Deep Space Optical Communications Relay Hits Record 2.4 Gbps Downlink',
    category: 'Aerospace & Telecom',
    priority: 'normal',
    estimatedReadTimeMinutes: 2,
    addedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    sourceUrl: 'https://spacedispatch.example/optical-laser-relay-milestone',
    content: `Space agency engineers achieved a milestone by transmitting uncompressed high-definition video and raw planetary telemetry across 30 million kilometers using an infrared laser communications terminal at a sustained rate of 2.4 gigabits per second. The transmission speed is nearly forty times faster than legacy radio-frequency deep space links.

Ground stations equipped with adaptive optics successfully corrected for atmospheric turbulence and cloud scattering in real time. The breakthrough paves the way for real-time high-definition video streaming from upcoming crewed missions to the Moon and Mars, and significantly reduces data downlink queues for orbital scientific observatories.`,
  },
];
