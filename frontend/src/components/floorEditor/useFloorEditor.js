import { useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import useFloorEditorStore from '../../store/floorEditorStore';

export function useFloorEditor(eventId) {
  const {
    elements, planId, planName, canvasWidth, canvasHeight,
    setPlanMeta, setElements, markSaved, resetStore,
  } = useFloorEditorStore();

  const loadPlan = useCallback(async () => {
    try {
      const res = await api.get(`/events/${eventId}/floor-editor`);
      if (res.status === 204 || !res.data) { resetStore(); return; }
      setPlanMeta(res.data);
      setElements(res.data.elements || []);
    } catch {
      resetStore();
    }
  }, [eventId]);

  const savePlan = useCallback(async () => {
    const payload = { name: planName, elements, canvasWidth, canvasHeight };
    try {
      let res;
      if (planId) {
        res = await api.put(`/events/${eventId}/floor-editor`, payload);
      } else {
        res = await api.post(`/events/${eventId}/floor-editor`, payload);
      }
      setPlanMeta(res.data);
      setElements(res.data.elements || []);
      markSaved();
      toast.success('Plano guardado ✓');
    } catch {
      toast.error('Error al guardar el plano');
    }
  }, [eventId, planId, elements, planName, canvasWidth, canvasHeight]);

  const deletePlan = useCallback(async () => {
    try {
      await api.delete(`/events/${eventId}/floor-editor`);
      resetStore();
      toast.success('Plano eliminado');
    } catch {
      toast.error('Error al eliminar el plano');
    }
  }, [eventId]);

  return { loadPlan, savePlan, deletePlan };
}

