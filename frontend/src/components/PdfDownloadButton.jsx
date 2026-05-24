import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * Botón de descarga de PDF con control de permisos.
 *
 * Props:
 *  permissionCode   — código de permiso requerido (ej: 'PDF_PROTOCOL').
 *                     Si es null/undefined, siempre visible (para OFFICE que ya tiene todo).
 *  label            — texto del botón (ej: 'Descargar protocolo PDF')
 *  fileName         — nombre del archivo descargado (ej: 'protocolo-boda.pdf')
 *  fetchData        — async () => { ... } — función que obtiene datos frescos de la API
 *  DocumentComponent — componente React PDF (ej: ProtocolPdfDoc)
 *  variant          — 'primary' | 'ghost' (estilo visual, default 'ghost')
 *  className        — clases adicionales
 */
export default function PdfDownloadButton({
  permissionCode,
  label = 'Descargar PDF',
  fileName = 'documento.pdf',
  fetchData,
  DocumentComponent,
  variant = 'ghost',
  className = '',
}) {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);

  // Si se especifica permiso y no lo tiene → no renderizar el botón
  if (permissionCode && !hasPermission(permissionCode)) return null;

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Siempre obtenemos datos frescos de la API
      const data = await fetchData();
      const element = <DocumentComponent data={data} />;
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF generado correctamente');
    } catch (err) {
      console.error('Error generando PDF:', err);
      toast.error('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const base = variant === 'primary'
    ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 transition-colors shadow-sm'
    : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-stone-200 bg-white text-stone-600 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-60 transition-colors';

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`${base} ${className}`}
      title={loading ? 'Generando PDF…' : label}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : <FileDown size={14} />
      }
      {loading ? 'Generando…' : label}
    </button>
  );
}

