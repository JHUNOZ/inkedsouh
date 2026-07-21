// Título de sección gigante estilo Dark Tech
import styles from './SectionTitle.module.css'

export default function SectionTitle({ children, subtitle, number, className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {/* Subtítulo superior con número */}
      <div className={styles.topBar}>
        {number && <span className={styles.number}>{number}</span>}
        {number && <span className={styles.dash}>—</span>}
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        <div className={styles.line}></div>
      </div>
      
      {/* Título Gigante */}
      <h2 className={styles.title}>
        {children}
        <span className={styles.redBlock}></span>
        <div className={styles.bottomLine}></div>
      </h2>
    </div>
  )
}
