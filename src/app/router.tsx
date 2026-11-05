import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/app/layout/AppShell'
import { AgendaPage } from '@/features/agenda/components/AgendaPage'
import { ClientsPage } from '@/features/clients/components/ClientsPage'
import { ContractDetailPage } from '@/features/contracts/components/ContractDetailPage'
import { ContractsLayout } from '@/features/contracts/components/ContractsLayout'
import { ContractsPage } from '@/features/contracts/components/ContractsPage'
import { PublicContractPage } from '@/features/contracts/components/PublicContractPage'
import { StudioSettingsPage } from '@/features/contracts/components/StudioSettingsPage'
import { TemplatesPage } from '@/features/contracts/components/TemplatesPage'
import { FinancePage } from '@/features/finance/components/FinancePage'
import { GalleriesPage } from '@/features/galleries/components/GalleriesPage'
import { GalleryDetailPage } from '@/features/galleries/components/GalleryDetailPage'
import { PublicDeliveryPage } from '@/features/galleries/components/public/PublicDeliveryPage'
import { PublicSelectionPage } from '@/features/galleries/components/public/PublicSelectionPage'
import { PackagesPage } from '@/features/packages/components/PackagesPage'

const router = createBrowserRouter([
  {
    path: '/assinar/:token',
    element: <PublicContractPage />,
  },
  {
    path: '/selecao/:token',
    element: <PublicSelectionPage />,
  },
  {
    path: '/entrega/:token',
    element: <PublicDeliveryPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/agenda" replace /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'pacotes', element: <PackagesPage /> },
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'galerias', element: <GalleriesPage /> },
      { path: 'galerias/:galeriaId', element: <GalleryDetailPage /> },
      { path: 'financeiro', element: <FinancePage /> },
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

export function AppRouter() {
  return <RouterProvider router={router} />
}
