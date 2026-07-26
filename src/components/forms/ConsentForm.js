'use client'
import { useState, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Check, X, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import styles from './ConsentForm.module.css'

export default function ConsentForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    fullName: '',
    rut: '',
    age: '',
    phone: '',
    email: '',
    medicalConditions: {
      pregnant: false,
      diabetes: false,
      heartDisease: false,
      epilepsy: false,
      hemophilia: false,
      hepatitis: false,
      hiv: false,
      allergies: false,
    },
    allergiesDetails: '',
    acknowledgements: {
      permanent: false,
      infection: false,
      aftercare: false,
      noRefund: false
    }
  })

  const [signatureError, setSignatureError] = useState('')
  const sigCanvas = useRef({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMedicalChange = (condition) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: {
        ...prev.medicalConditions,
        [condition]: !prev.medicalConditions[condition]
      }
    }))
  }

  const handleAckChange = (ack) => {
    setFormData(prev => ({
      ...prev,
      acknowledgements: {
        ...prev.acknowledgements,
        [ack]: !prev.acknowledgements[ack]
      }
    }))
  }

  const clearSignature = () => {
    sigCanvas.current.clear()
    setSignatureError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (sigCanvas.current.isEmpty()) {
      setSignatureError('La firma es obligatoria.')
      return
    }

    // Verify all acknowledgements are checked
    const allAckChecked = Object.values(formData.acknowledgements).every(val => val === true)
    if (!allAckChecked) {
      setSignatureError('Debes aceptar todos los términos de consentimiento.')
      return
    }

    const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    
    if (onSubmit) {
      onSubmit({
        ...formData,
        signature: signatureData
      })
    }
  }

  return (
    <motion.div 
      className={styles.wrapper}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className={styles.header}>
        <ShieldAlert size={32} className={styles.headerIcon} />
        <h2>Formulario de Consentimiento y Relevo de Responsabilidad</h2>
        <p>Por favor lee cuidadosamente y completa todos los campos requeridos antes de tu sesión de tatuaje.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* Información Personal */}
        <div className={styles.section}>
          <h3>1. Información Personal</h3>
          <div className={styles.gridContainer}>
            <div className={styles.inputWrap}>
              <label>Nombre Completo</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
            </div>
            <div className={styles.inputWrap}>
              <label>RUT / ID</label>
              <input type="text" name="rut" value={formData.rut} onChange={handleInputChange} required />
            </div>
            <div className={styles.inputWrap}>
              <label>Edad (Debe ser mayor de 18)</label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} min="18" required />
            </div>
            <div className={styles.inputWrap}>
              <label>Teléfono</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
            </div>
            <div className={styles.inputWrap} style={{ gridColumn: '1 / -1' }}>
              <label>Correo Electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            </div>
          </div>
        </div>

        {/* Cuestionario Médico */}
        <div className={styles.section}>
          <h3>2. Historial Médico</h3>
          <p className={styles.sectionHint}>Marca las condiciones que padezcas actualmente o hayas padecido:</p>
          <div className={styles.checkboxGrid}>
            {[
              { id: 'pregnant', label: 'Embarazo o Lactancia' },
              { id: 'diabetes', label: 'Diabetes' },
              { id: 'heartDisease', label: 'Enfermedades Cardíacas' },
              { id: 'epilepsy', label: 'Epilepsia' },
              { id: 'hemophilia', label: 'Hemofilia / Trastornos de Sangrado' },
              { id: 'hepatitis', label: 'Hepatitis' },
              { id: 'hiv', label: 'VIH / SIDA' },
              { id: 'allergies', label: 'Alergias severas' },
            ].map(cond => (
              <label key={cond.id} className={`${styles.checkboxLabel} interactive`}>
                <input 
                  type="checkbox" 
                  checked={formData.medicalConditions[cond.id]}
                  onChange={() => handleMedicalChange(cond.id)}
                />
                <span className={styles.customCheckbox}>
                  {formData.medicalConditions[cond.id] && <Check size={14} />}
                </span>
                {cond.label}
              </label>
            ))}
          </div>
          {formData.medicalConditions.allergies && (
            <div className={styles.inputWrap} style={{ marginTop: '16px' }}>
              <label>Por favor especifica tus alergias (tintas, látex, jabones, etc.)</label>
              <input type="text" name="allergiesDetails" value={formData.allergiesDetails} onChange={handleInputChange} required />
            </div>
          )}
        </div>

        {/* Consentimiento */}
        <div className={styles.section}>
          <h3>3. Declaración de Consentimiento</h3>
          <div className={styles.ackList}>
            <label className={`${styles.ackLabel} interactive`}>
              <input type="checkbox" checked={formData.acknowledgements.permanent} onChange={() => handleAckChange('permanent')} required />
              <div className={styles.ackText}>
                <strong>Naturaleza Permanente:</strong> Entiendo que un tatuaje es un cambio permanente en mi piel y que la modificación o remoción puede ser costosa, dolorosa o imposible.
              </div>
            </label>
            <label className={`${styles.ackLabel} interactive`}>
              <input type="checkbox" checked={formData.acknowledgements.infection} onChange={() => handleAckChange('infection')} required />
              <div className={styles.ackText}>
                <strong>Riesgos de Infección:</strong> Comprendo que existe riesgo de infección si no sigo estrictamente las instrucciones de cuidado posterior.
              </div>
            </label>
            <label className={`${styles.ackLabel} interactive`}>
              <input type="checkbox" checked={formData.acknowledgements.aftercare} onChange={() => handleAckChange('aftercare')} required />
              <div className={styles.ackText}>
                <strong>Cuidado Posterior:</strong> Me comprometo a seguir las instrucciones de cuidado entregadas por el artista para garantizar una correcta sanación.
              </div>
            </label>
            <label className={`${styles.ackLabel} interactive`}>
              <input type="checkbox" checked={formData.acknowledgements.noRefund} onChange={() => handleAckChange('noRefund')} required />
              <div className={styles.ackText}>
                <strong>Diseño y Reembolsos:</strong> Apruebo el diseño, ubicación y colores. Entiendo que los abonos no son reembolsables.
              </div>
            </label>
          </div>
        </div>

        {/* Firma */}
        <div className={styles.section}>
          <h3>4. Firma Digital</h3>
          <p className={styles.sectionHint}>Firma dentro del recuadro para aceptar los términos.</p>
          <div className={styles.signatureContainer}>
            <SignatureCanvas 
              penColor="red"
              canvasProps={{ className: styles.sigPad }}
              ref={sigCanvas}
              backgroundColor="rgba(255, 255, 255, 0.05)"
            />
            <button type="button" onClick={clearSignature} className={styles.clearSigBtn}>
              <X size={14} /> Limpiar
            </button>
          </div>
          {signatureError && <div className={styles.errorMsg}>{signatureError}</div>}
        </div>

        <div className={styles.actions}>
          {onCancel && (
            <button type="button" onClick={onCancel} className={styles.btnCancel}>
              Cancelar
            </button>
          )}
          <button type="submit" className={styles.btnSubmit}>
            Aceptar y Confirmar
          </button>
        </div>
      </form>
    </motion.div>
  )
}
