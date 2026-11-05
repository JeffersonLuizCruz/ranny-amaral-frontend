import { create } from 'zustand'

import type {
  AgendaFilters,
  AgendamentoStatus,
  AppointmentDrawerState,
  CalendarView,
} from '@/domain/types'
import { fromDateKey, shiftDate, toDateKey } from '@/shared/lib/date'

const CLOSED_DRAWER: AppointmentDrawerState = {
  mode: null,
  appointmentId: null,
  defaultDate: null,
  defaultStartTime: null,
  defaultClienteId: null,
}

const EMPTY_FILTERS: AgendaFilters = {
  hiddenStatuses: [],
  hiddenPackageIds: [],
}

interface AgendaState {
  view: CalendarView
  /** `yyyy-MM-dd` local date key. */
  selectedDate: string
  sidebarOpen: boolean
  filters: AgendaFilters
  drawer: AppointmentDrawerState

  setView: (view: CalendarView) => void
  setSelectedDate: (date: Date | string) => void
  goToday: () => void
  navigate: (direction: 1 | -1) => void
  setSidebarOpen: (open: boolean) => void
  toggleStatusFilter: (status: AgendamentoStatus) => void
  togglePackageFilter: (packageId: string) => void
  clearFilters: () => void
  openCreateDrawer: (date?: Date | string, startTime?: string, clienteId?: string) => void
  openAppointmentDrawer: (
    appointmentId: string,
    mode?: Extract<AppointmentDrawerState['mode'], 'view' | 'edit'>,
  ) => void
  closeDrawer: () => void
}

function initialView(): CalendarView {
  if (typeof window === 'undefined') return 'month'
  return window.matchMedia('(max-width: 767px)').matches ? 'day' : 'month'
}

export const useAgendaStore = create<AgendaState>((set, get) => ({
  view: initialView(),
  selectedDate: toDateKey(new Date()),
  sidebarOpen: false,
  filters: EMPTY_FILTERS,
  drawer: CLOSED_DRAWER,

  setView: (view) => set({ view }),

  setSelectedDate: (date) =>
    set({ selectedDate: typeof date === 'string' ? date : toDateKey(date) }),

  goToday: () => set({ selectedDate: toDateKey(new Date()) }),

  navigate: (direction) => {
    const { view, selectedDate } = get()
    const next = shiftDate(fromDateKey(selectedDate), view, direction)
    set({ selectedDate: toDateKey(next) })
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleStatusFilter: (status) =>
    set((state) => {
      const hidden = state.filters.hiddenStatuses
      return {
        filters: {
          ...state.filters,
          hiddenStatuses: hidden.includes(status)
            ? hidden.filter((item) => item !== status)
            : [...hidden, status],
        },
      }
    }),

  togglePackageFilter: (packageId) =>
    set((state) => {
      const hidden = state.filters.hiddenPackageIds
      return {
        filters: {
          ...state.filters,
          hiddenPackageIds: hidden.includes(packageId)
            ? hidden.filter((item) => item !== packageId)
            : [...hidden, packageId],
        },
      }
    }),

  clearFilters: () => set({ filters: EMPTY_FILTERS }),

  openCreateDrawer: (date, startTime = '09:00', clienteId) =>
    set((state) => ({
      drawer: {
        mode: 'create',
        appointmentId: null,
        defaultDate:
          typeof date === 'string' ? date : date ? toDateKey(date) : state.selectedDate,
        defaultStartTime: startTime,
        defaultClienteId: clienteId ?? null,
      },
    })),

  openAppointmentDrawer: (appointmentId, mode = 'view') =>
    set({
      drawer: {
        mode,
        appointmentId,
        defaultDate: null,
        defaultStartTime: null,
        defaultClienteId: null,
      },
    }),

  closeDrawer: () => set({ drawer: CLOSED_DRAWER }),
}))
