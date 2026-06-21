export function LumaIconArtwork({ stroke = 22 }: { stroke?: number }) {
  const tile = {
    position: 'absolute' as const,
    width: '35%',
    height: '35%',
    border: `${stroke}px solid #fafafa`,
    borderRadius: '30%',
    display: 'flex',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', background: '#09090b' }}>
      <div style={{ ...tile, left: '18%', top: '18%' }} />
      <div style={{ ...tile, right: '18%', bottom: '18%' }} />
    </div>
  )
}
