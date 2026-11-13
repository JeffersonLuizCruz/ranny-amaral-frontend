import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useParams,
} from 'react-router-dom'

import { AppShell } from '@/app/layout/AppShell'
import { AgendaPage } from '@/features/agenda/components/AgendaPage'
import { ChangePasswordPage } from '@/features/auth/components/ChangePasswordPage'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { RequireAdmin, RequireAuth } from '@/features/auth/components/RequireAuth'
import { ClientsPage } from '@/features/clients/components/ClientsPage'
import { ClientDetailPage } from '@/features/clients/components/ClientDetailPage'
import { ContractDetailPage } from '@/features/contracts/components/ContractDetailPage'
import { ContractsLayout } from '@/features/contracts/components/ContractsLayout'
import { ContractsPage } from '@/features/contracts/components/ContractsPage'
import { PublicContractPage } from '@/features/contracts/components/PublicContractPage'
import { StudioSettingsPage } from '@/features/contracts/components/StudioSettingsPage'
import { TemplatesPage } from '@/features/contracts/components/TemplatesPage'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'
import { FinancePage } from '@/features/finance/components/FinancePage'
import { GalleriesPage } from '@/features/galleries/components/GalleriesPage'
import { GalleryDetailPage } from '@/features/galleries/components/GalleryDetailPage'
import { PublicSelectionPage } from '@/features/galleries/components/public/PublicSelectionPage'
import { PackagesPage } from '@/features/packages/components/PackagesPage'
import { StoragePage } from '@/features/storage/components/StoragePage'
import { UsersPage } from '@/features/users/components/UsersPage'

const router = createBrowserRouter([
  {
    path: '/assinar/:token',
    element: <PublicContractPage />,
  },
  {
    path: '/galeria/:token',
    element: <PublicSelectionPage />,
  },
  {
    path: '/selecao/:token',
    element: <RedirecionarParaGaleria />,
  },
  {
    path: '/entrega/:token',
    element: <RedirecionarParaGaleria />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/trocar-senha',
    element: (
      <RequireAuth>
        <ChangePasswordPage />
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'pacotes', element: <PackagesPage /> },
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'clientes/:clienteId', element: <ClientDetailPage /> },
      { path: 'galerias', element: <GalleriesPage /> },
      { path: 'galerias/:galeriaId', element: <GalleryDetailPage /> },
      { path: 'armazenamento', element: <StoragePage /> },
      { path: 'financeiro', element: <FinancePage /> },
      {
        path: 'usuarios',
        element: (
          <RequireAdmin>
            <UsersPage />
          </RequireAdmin>
        ),
      },
      {
        path: 'contratos',
        element: <ContractsLayout />,
        children: [
          { index: true, element: <ContractsPage /> },
          { path: ':contratoId', element: <ContractDetailPage /> },
          { path: 'modelos', element: <TemplatesPage /> },
          { path: 'configuracoes', element: <StudioSettingsPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/agenda" replace /> },
    ],
  },
])

function RedirecionarParaGaleria() {
  const { token = '' } = useParams()
  return <Navigate to={`/galeria/${token}`} replace />
}

export function AppRouter() {
  return <RouterProvider router={router} />
}
