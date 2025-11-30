import React from 'react'

export default function FullScreenModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        marginBottom: '10px'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h2>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '2px solid white',
            color: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
