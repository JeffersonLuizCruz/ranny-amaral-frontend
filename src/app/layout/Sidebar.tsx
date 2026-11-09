import {
  CalendarDays,
  Camera,
  Download,
  FileSignature,
  Images,
  LayoutDashboard,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/authStore'
import { useAgendaStore } from '@/features/agenda/store/agendaStore'
import { AgendaFilters } from '@/features/agenda/components/AgendaFilters'
import { MiniCalendar } from '@/features/agenda/components/MiniCalendar'
import { useAppointmentStore } from '@/features/appointments/store/appointmentStore'
import { useClientStore } from '@/features/clients/store/clientStore'
import { useContractStore } from '@/features/contracts/store/contractStore'
import { useStudioStore } from '@/features/contracts/store/studioStore'
import { useTemplateStore } from '@/features/contracts/store/templateStore'
import { useGalleryStore } from '@/features/galleries/store/galleryStore'
import { usePackageStore } from '@/features/packages/store/packageStore'
import { Button, IconButton } from '@/shared/components/ui/Button'
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt'
import { cn } from '@/shared/lib/cn'
import { mensagemDeErro } from '@/shared/api/errors'
import { useToastStore } from '@/shared/store/toastStore'

interface SidebarProps {
  onNavigate?: () => void
  onClose?: () => void
}

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/pacotes', label: 'Pacotes', icon: Package, end: false },
  { to: '/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/contratos', label: 'Contratos', icon: FileSignature, end: false },
  { to: '/galerias', label: 'Galerias', icon: Images, end: false },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, end: false },
]

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const openCreateDrawer = useAgendaStore((state) => state.openCreateDrawer)
  const selectedDate = useAgendaStore((state) => state.selectedDate)
  const recarregarClientes = useClientStore((state) => state.recarregar)
  const recarregarPacotes = usePackageStore((state) => state.recarregar)
  const recarregarAgendamentos = useAppointmentStore((state) => state.recarregar)
  const recarregarContratos = useContractStore((state) => state.recarregar)
  const recarregarModelos = useTemplateStore((state) => state.recarregar)
  const recarregarEstudio = useStudioStore((state) => state.recarregar)
  const recarregarGalerias = useGalleryStore((state) => state.recarregar)
  const addToast = useToastStore((state) => state.addToast)
  const { canInstall, installing, install } = useInstallPrompt()
  const navItems = isAdmin
    ? [...NAV_ITEMS, { to: '/usuarios', label: 'Usuários', icon: ShieldCheck, end: false }]
    : NAV_ITEMS

  const handleInstall = async () => {
    const accepted = await install()
    if (accepted) addToast('Aplicativo instalado com sucesso.')
  }

  const handleReload = async () => {
    const confirmed = window.confirm(
      'Recarregar clientes, pacotes, agenda, contratos, modelos, estúdio e galerias do servidor?',
    )
    if (!confirmed) return

    try {
      await Promise.all([
        recarregarClientes(),
        recarregarPacotes(),
        recarregarAgendamentos(),
        recarregarContratos(),
        recarregarModelos(),
        recarregarEstudio(),
        recarregarGalerias(),
      ])
      addToast('Dados recarregados do servidor.')
    } catch (error) {
      addToast(mensagemDeErro(error))
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
          <Camera className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">Photoizer</p>
          <p className="text-[11px] text-muted">CRM para estúdios</p>
        </div>
        {onClose ? (
          <IconButton label="Fechar menu" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        ) : null}
      </div>

      <div className="px-4 pb-2 pt-3">
        <Button
          fullWidth
          size="lg"
          onClick={() => {
            openCreateDrawer()
            onNavigate?.()
          }}
        >
          <Plus className="size-4" />
          Novo ensaio
        </Button>
      </div>

      <div className="thin-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        <nav aria-label="Navegação principal" className="mt-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-muted hover:bg-slate-100 hover:text-ink',
                  )
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-4 border-t border-line pt-3">
          <MiniCalendar key={selectedDate} onSelect={onNavigate} />
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <AgendaFilters />
        </div>

        <div className="mt-4 space-y-2 border-t border-line pt-3">
          {canInstall ? (
            <Button variant="tonal" fullWidth onClick={handleInstall} disabled={installing}>
              <Download className="size-4" />
              {installing ? 'Instalando…' : 'Instalar aplicativo'}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 px-2 text-[11px] font-medium text-brand-700 transition hover:underline"
          >
            <RotateCcw className="size-3" />
            Recarregar dados
          </button>
          <p className="px-2 pb-2 text-[10px] leading-relaxed text-muted">
            Atalhos: <span className="font-medium text-ink">N</span> novo ensaio ·{' '}
            <span className="font-medium text-ink">T</span> hoje ·{' '}
            <span className="font-medium text-ink">M/W/D</span> visualizações
          </p>
        </div>
      </div>
    </div>
  )
}
