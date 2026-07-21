'use client'
// Perfil del tatuador (editable) y Billetera
import { useState } from 'react'
import { User, Save, Lock, Wallet, Eye, EyeOff } from 'lucide-react'
import BubbleButton from '@/components/ui/BubbleButton'
import mainStyles from '../main.module.css'

export default function PerfilAdmin() {
  // Tabs: 'perfil', 'billetera', 'seguridad'
  const [activeTab, setActiveTab] = useState('perfil')

  const [profile, setProfile] = useState({
    name: 'INKEDSOUH',
    bio: 'Artista del tatuaje especializado en crear obras únicas sobre la piel.',
    specialties: 'Blackwork, Lettering, Realismo, Neotradicional',
    instagram: 'https://www.instagram.com/inked.tto/',
  })

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => { 
    setSaved(true)
    setTimeout(() => setSaved(false), 2000) 
  }

  const handlePasswordChange = () => {
    if(passwords.new !== passwords.confirm) {
      alert("Las contraseñas nuevas no coinciden")
      return
    }
    alert("Contraseña actualizada exitosamente")
    setPasswords({ current: '', new: '', confirm: '' })
  }

  const inp = { 
    width: '100%', padding: '12px', background: '#141414', border: '1px solid #2A2A2A', 
    borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none' 
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 className={mainStyles.title}>Mi Perfil</h1>
      <p className={mainStyles.subtitle}>Gestiona tu información personal, seguridad y métodos de pago</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #2A2A2A', paddingBottom: '15px' }}>
        <button
          onClick={() => setActiveTab('perfil')}
          style={{
            padding: '7px 16px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'perfil' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'perfil' ? '#C41E1E' : 'transparent',
            color: activeTab === 'perfil' ? '#fff' : '#888',
          }}
        >
          <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Datos Personales
        </button>
        <button
          onClick={() => setActiveTab('seguridad')}
          style={{
            padding: '7px 16px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'seguridad' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'seguridad' ? '#C41E1E' : 'transparent',
            color: activeTab === 'seguridad' ? '#fff' : '#888',
          }}
        >
          <Lock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Seguridad
        </button>
        <button
          onClick={() => setActiveTab('billetera')}
          style={{
            padding: '7px 16px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'billetera' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'billetera' ? '#C41E1E' : 'transparent',
            color: activeTab === 'billetera' ? '#fff' : '#888',
          }}
        >
          <Wallet size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Mi Billetera
        </button>
      </div>

      {/* CONTENIDO TABS */}
      <div className={mainStyles.section} style={{ background: 'transparent', padding: 0, border: 'none' }}>
        
        {/* TAB PERFIL */}
        {activeTab === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#141414', border: '2px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#525252' }}>
                <User size={32} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <BubbleButton size="small" variant="outline">Subir Nueva Foto</BubbleButton>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>Recomendado: 400x400px en PNG o JPG</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>NOMBRE / ALIAS</label>
              <input style={inp} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>BIOGRAFÍA (Mostrada en la web)</label>
              <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical' }} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>ESPECIALIDADES (separadas por coma)</label>
              <input style={inp} value={profile.specialties} onChange={(e) => setProfile({ ...profile, specialties: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>LINK DE INSTAGRAM</label>
              <input style={inp} value={profile.instagram} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} />
            </div>

            <div style={{ marginTop: '10px' }}>
              <BubbleButton onClick={handleSave}><Save size={16} /> {saved ? '¡Guardado!' : 'Guardar Cambios'}</BubbleButton>
            </div>
          </div>
        )}

        {/* TAB SEGURIDAD */}
        {activeTab === 'seguridad' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px' }}>
              Cambia tu contraseña de administrador. Te recomendamos usar una contraseña fuerte, según las directrices de seguridad de OWASP.
            </p>
            
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>CONTRASEÑA ACTUAL</label>
              <input 
                type={showPass ? 'text' : 'password'} 
                style={inp} 
                value={passwords.current} 
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} 
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '35px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>NUEVA CONTRASEÑA</label>
              <input 
                type={showPass ? 'text' : 'password'} 
                style={inp} 
                value={passwords.new} 
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} 
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>CONFIRMAR NUEVA CONTRASEÑA</label>
              <input 
                type={showPass ? 'text' : 'password'} 
                style={inp} 
                value={passwords.confirm} 
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} 
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <BubbleButton onClick={handlePasswordChange}><Lock size={16} /> Actualizar Contraseña</BubbleButton>
            </div>
          </div>
        )}

        {/* TAB BILLETERA */}
        {activeTab === 'billetera' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
              <Wallet size={48} color="#C41E1E" style={{ margin: '0 auto 15px auto', opacity: 0.8 }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '10px' }}>Webpay Plus (Próximamente)</h2>
              <p style={{ color: '#888', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
                Estamos preparando la integración oficial con Transbank para que puedas recibir pagos automáticos directamente en tus reservas y cursos.
              </p>
            </div>

            <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Datos Bancarios Actuales</h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
                Estos son los datos que se le muestran a los clientes actualmente para realizar transferencias manuales.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>BANCO</label>
                  <input style={inp} defaultValue="Banco Estado" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>TIPO DE CUENTA</label>
                  <input style={inp} defaultValue="Cuenta RUT" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>NÚMERO DE CUENTA</label>
                  <input style={inp} defaultValue="12.345.678-9" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>CORREO (Para comprobantes)</label>
                  <input style={inp} defaultValue="pagos@inkedsouh.com" />
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <BubbleButton onClick={handleSave}><Save size={16} /> Guardar Datos Bancarios</BubbleButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
