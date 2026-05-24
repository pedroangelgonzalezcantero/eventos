const STATUS_STYLES = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  PENDIENTE_INFO: 'bg-amber-100 text-amber-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  CONFIRMADO: 'bg-emerald-100 text-emerald-700',
  COMPLETADO: 'bg-purple-100 text-purple-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

const TYPE_EMOJI = {
  BODA: '💍', COMUNION: '✝️', BAUTIZO: '👶', CUMPLEANOS: '🎂',
  ANIVERSARIO: '💕', EMPRESA: '🏢', PRIVADO: '🎉', OTRO: '📅',
};

export default function EventCard({ event, onClick }) {
  const daysLeft = event.daysUntilEvent;
  const daysColor = daysLeft < 7 ? 'text-red-600' : daysLeft < 30 ? 'text-amber-600' : 'text-gray-500';

  return (
    <div onClick={onClick}
      className="card hover:shadow-md cursor-pointer transition-shadow duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{TYPE_EMOJI[event.type] || '📅'}</span>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">
              {event.clientName}
            </h3>
            <p className="text-sm text-gray-500">{event.typeLabel}</p>
          </div>
        </div>
        <span className={`badge ${STATUS_STYLES[event.status]}`}>{event.statusLabel}</span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <p>📅 {new Date(event.eventDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        {event.venue && <p>📍 {event.venue}</p>}
        {event.estimatedGuests && <p>👥 {event.estimatedGuests} invitados</p>}
      </div>

      {/* Indicadores de completitud */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Dot ok={event.menuConfirmed} label="Menu" />
        <Dot ok={event.allergensCompleted} label="Alergenos" />
        <Dot ok={event.protocolCompleted} label="Protocolo" />
        <Dot ok={event.budgetSigned} label="Presupuesto" />
      </div>

      <p className={`text-xs font-medium ${daysColor}`}>
        {daysLeft > 0 ? `Faltan ${daysLeft} dias` : daysLeft === 0 ? '¡Es hoy!' : `Hace ${Math.abs(daysLeft)} dias`}
      </p>
    </div>
  );
}

function Dot({ ok, label }) {
  return (
    <span className={`badge text-xs ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      {ok ? '✓' : '○'} {label}
    </span>
  );
}
