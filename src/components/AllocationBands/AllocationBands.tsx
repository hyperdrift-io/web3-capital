import type { Pool, AllocationBand } from '@/types/protocol'
import { formatApy } from '@/lib/format'
import styles from './AllocationBands.module.css'

type Props = {
  pools: Pool[]
}

const BAND_CONFIG: Record<AllocationBand, {
  label: string
  description: string
  apyRange: string
  titleClass: string
  bandClass: string
}> = {
  anchor: {
    label: 'Anchor',
    description: 'Battle-tested protocols with deep liquidity. Core allocation for capital preservation with yield.',
    apyRange: '2–12%',
    titleClass: styles['title--anchor'],
    bandClass: styles['band--anchor'],
  },
  balanced: {
    label: 'Balanced',
    description: 'Established protocols with meaningful TVL. Satellite allocation for enhanced yield with managed risk.',
    apyRange: '6–25%',
    titleClass: styles['title--balanced'],
    bandClass: styles['band--balanced'],
  },
  opportunistic: {
    label: 'Opportunistic',
    description: 'Higher-risk, higher-return positions. Capped exposure — reward liquidity incentives, newer protocols.',
    apyRange: '25%+',
    titleClass: styles['title--opportunistic'],
    bandClass: styles['band--opportunistic'],
  },
}

export function AllocationBands({ pools }: Props) {
  const byBand = {
    anchor:        pools.filter(p => p.band === 'anchor'),
    balanced:      pools.filter(p => p.band === 'balanced'),
    opportunistic: pools.filter(p => p.band === 'opportunistic'),
  }

  return (
    <div className={styles.grid}>
      {(Object.keys(BAND_CONFIG) as AllocationBand[]).map(band => {
        const config = BAND_CONFIG[band]
        const bandPools = byBand[band].slice(0, 4)
        const apyValues = byBand[band].map(p => p.apy)
        const avgApy = apyValues.length
          ? apyValues.reduce((a, b) => a + b, 0) / apyValues.length
          : 0

        return (
          <div key={band} className={`${styles.band} ${config.bandClass}`}>
            <div className={styles.header}>
              <span className={`${styles.title} ${config.titleClass}`}>
                {config.label}
              </span>
              <span className={styles.count}>{byBand[band].length} pools</span>
            </div>

            <div className={styles.apyRange}>
              {avgApy > 0 ? `avg ${formatApy(avgApy)}` : config.apyRange}
            </div>

            <p className={styles.description}>{config.description}</p>

            <div className={styles.pools}>
              {bandPools.map(pool => (
                <div key={pool.pool} className={styles.poolRow}>
                  <span className={styles.poolName}>{pool.project}</span>
                  <span className={styles.poolApy}>{formatApy(pool.apy)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
